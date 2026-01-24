import { sendEmail, getOrganizationInviteEmailTemplate, getContactCardShareEmailTemplate } from './email'

export const sendOrgInviteEmail = async (data: {
    recipientEmail: string
    organizationName: string
    inviterName: string
    inviterEmail: string
    organizationLogo?: string
    message?: string
    appUrl?: string
}) => {
    const { subject, html } = getOrganizationInviteEmailTemplate(data)
    return await sendEmail({
        to: data.recipientEmail,
        subject,
        html,
    })
}

export const sendContactCardEmail = async (data: {
    recipientEmail: string
    recipientName: string
    senderName: string
    senderEmail: string
    cardName: string
    cardUrl: string
    message?: string
    cardPhotoUrl?: string
    cardJobTitle?: string
    cardCompany?: string
}) => {
    // Map parameters to template input (template might ignore some extra fields but that's fine)
    // The 'getContactCardShareEmailTemplate' in email.ts seems to support senderName, senderEmail, recipientName, cardName, cardUrl, message.
    // We should pass what it supports.
    const { subject, html } = getContactCardShareEmailTemplate({
        senderName: data.senderName,
        senderEmail: data.senderEmail,
        recipientName: data.recipientName,
        cardName: data.cardName,
        cardUrl: data.cardUrl,
        message: data.message,
    })

    return await sendEmail({
        to: data.recipientEmail,
        subject,
        html,
    })
}
