// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text } = await req.json()

    // Configuración de Gmail SMTP
    const EMAIL_USER = (Deno as any).env.get('EMAIL_USER')
    const EMAIL_PASS = (Deno as any).env.get('EMAIL_PASS')
    
    if (!EMAIL_USER || !EMAIL_PASS) {
      throw new Error('EMAIL_USER o EMAIL_PASS no configuradas')
    }

    // Usar Gmail SMTP directamente con nodemailer
    // @ts-ignore
    const nodemailer = await import('https://esm.sh/nodemailer@6.9.7')
    
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    })

    const mailOptions = {
      from: 'gerencia@ingenit.cl',
      to: to,
      subject: subject,
      html: html,
      text: text
    }

    const info = await transporter.sendMail(mailOptions)

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
