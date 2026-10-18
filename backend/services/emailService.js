/**
 * ============================================================================
 * SERVICIO DE CORREOS (RESEND API HTTP)
 * ============================================================================
 * Utiliza peticiones HTTPS por el puerto 443, evitando los bloqueos de 
 * puertos SMTP en hostings como Render.
 */

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const enviarReciboCompra = async (emailCliente, nombreCliente, ordenId, items, total) => {
    if (!emailCliente) return;

    const listaProductosHTML = items.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}x ${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.price * item.quantity).toLocaleString('es-CL')}</td>
        </tr>
    `).join('');

    const totalFormateado = Number(total).toLocaleString('es-CL');

    try {
        const data = await resend.emails.send({
            // En la fase de pruebas (sandbox), Resend exige usar este correo de remitente oficial
            from: 'NutraNuts <onboarding@resend.dev>', 
            to: emailCliente,
            subject: `¡Gracias por tu compra! Orden #${ordenId} confirmada ✅`,
            html: `
                <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
                    <h2 style="color: #b45309; text-align: center;">¡Pedido Confirmado!</h2>
                    <p style="color: #374151; font-size: 16px;">Hola <strong>${nombreCliente}</strong>,</p>
                    <p style="color: #374151; font-size: 16px;">Hemos recibido tu pago correctamente. Tu orden <strong>#${ordenId}</strong> ya está en preparación para ser despachada.</p>
                    
                    <h3 style="color: #1f2937; margin-top: 30px;">Detalle de tu compra:</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tbody>
                            ${listaProductosHTML}
                            <tr>
                                <td style="padding: 10px; font-weight: bold; text-align: right;">Total Pagado:</td>
                                <td style="padding: 10px; font-weight: bold; text-align: right; color: #b45309; font-size: 18px;">$${totalFormateado}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `
        });

        console.log(`✉️ Recibo enviado exitosamente mediante API a ${emailCliente}`, data);
    } catch (error) {
        console.error('❌ Error enviando correo por API:', error);
    }
};

module.exports = { enviarReciboCompra };