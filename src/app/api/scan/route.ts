import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Simple OCR using free OCR.space API or manual extraction
// For production, consider using Google Cloud Vision or AWS Textract

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { imageUrl, imageBase64 } = body

    if (!imageUrl && !imageBase64) {
      return NextResponse.json({ success: false, error: 'Image required' }, { status: 400 })
    }

    // Use OCR.space free API for text extraction
    const ocrApiKey = process.env.OCR_SPACE_API_KEY || 'helloworld' // Free tier key
    
    const formData = new FormData()
    if (imageUrl) {
      formData.append('url', imageUrl)
    } else if (imageBase64) {
      formData.append('base64Image', `data:image/png;base64,${imageBase64}`)
    }
    formData.append('apikey', ocrApiKey)
    formData.append('language', 'eng')
    formData.append('isOverlayRequired', 'false')

    const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData
    })

    const ocrResult = await ocrResponse.json()
    
    if (ocrResult.IsErroredOnProcessing) {
      return NextResponse.json({ 
        success: false, 
        error: ocrResult.ErrorMessage || 'OCR processing failed' 
      }, { status: 400 })
    }

    const extractedText = ocrResult.ParsedResults?.[0]?.ParsedText || ''
    
    // Parse extracted text to find contact info
    const contactData = parseContactInfo(extractedText)

    return NextResponse.json({
      success: true,
      rawText: extractedText,
      contact: contactData
    })

  } catch (error: any) {
    console.error('Scan API error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// Parse contact information from OCR text
function parseContactInfo(text: string): {
  name: string | null
  email: string | null
  phone: string | null
  company: string | null
  jobTitle: string | null
} {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  
  // Email regex
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi
  const emailMatch = text.match(emailRegex)
  const email = emailMatch ? emailMatch[0].toLowerCase() : null

  // Phone regex (Indonesian format)
  const phoneRegex = /(?:\+62|62|0)[\s.-]?(?:\d{2,4})[\s.-]?(?:\d{3,4})[\s.-]?(?:\d{3,4})/gi
  const phoneMatch = text.match(phoneRegex)
  const phone = phoneMatch ? phoneMatch[0].replace(/[\s.-]/g, '') : null

  // Try to extract name (usually first line or largest text)
  let name: string | null = null
  let company: string | null = null
  let jobTitle: string | null = null

  // Common job title keywords
  const jobKeywords = ['manager', 'director', 'ceo', 'cto', 'founder', 'engineer', 'developer', 
    'designer', 'analyst', 'consultant', 'specialist', 'coordinator', 'executive', 'officer',
    'manajer', 'direktur', 'kepala', 'staff', 'supervisor']

  // Common company keywords
  const companyKeywords = ['pt', 'cv', 'inc', 'corp', 'ltd', 'llc', 'co.', 'company', 
    'group', 'indonesia', 'international', 'global', 'solutions', 'services', 'consulting']

  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    
    // Skip lines with email or phone
    if (emailRegex.test(line) || phoneRegex.test(line)) continue
    
    // Check for job title
    if (!jobTitle && jobKeywords.some(kw => lowerLine.includes(kw))) {
      jobTitle = line
      continue
    }
    
    // Check for company
    if (!company && companyKeywords.some(kw => lowerLine.includes(kw))) {
      company = line
      continue
    }
    
    // First substantial line without keywords is likely the name
    if (!name && line.length > 2 && line.length < 50 && !lowerLine.includes('@') && 
        !lowerLine.includes('www') && !lowerLine.includes('http')) {
      // Check if it looks like a name (mostly letters and spaces)
      if (/^[a-zA-Z\s.'-]+$/.test(line) || /^[\u0000-\u007F\u00C0-\u024F\s]+$/.test(line)) {
        name = line
      }
    }
  }

  return {
    name,
    email,
    phone,
    company,
    jobTitle
  }
}
