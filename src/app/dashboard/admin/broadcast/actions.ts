'use server'

import {
  getCreateCardPromoTemplate,
  getProUpgradePromoTemplate,
  getCompleteProfilePromoTemplate
} from '@/lib/email'

export async function getTemplatePreview(type: string, customSubject?: string, customMessage?: string) {
  const dummyName = 'Budi Santoso'
  let subject = ''
  let html = ''

  switch (type) {
    case 'create_card': {
      const t = getCreateCardPromoTemplate({ userName: dummyName })
      subject = t.subject
      html = t.html
      break
    }
    case 'upgrade_pro': {
      const t = getProUpgradePromoTemplate({ userName: dummyName })
      subject = t.subject
      html = t.html
      break
    }
    case 'complete_profile': {
      const t = getCompleteProfilePromoTemplate({ userName: dummyName })
      subject = t.subject
      html = t.html
      break
    }
    case 'custom': {
      subject = customSubject || 'Subjek Belum Diisi'
      html = (customMessage || 'Pesan Belum Diisi').replace(/{{name}}/g, dummyName)
      break
    }
    default:
      subject = 'Unknown'
      html = 'Unknown template'
  }

  return { subject, html }
}
