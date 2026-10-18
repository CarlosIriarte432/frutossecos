const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const enviarReciboCompra = async (emailCliente, nombreCliente, ordenId, items, total) => {
    if (!emailCliente) return;

    const listaProductosHTML = items.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}x ${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.price * item.quantity).toLocaleString('es-CL')}</td>
        </tr>
    `).join('');

    const totalFormateado = Number(total).toLocaleString('es-CL');

    const mailOptions = {
        from: `"NutraNuts" <${process.env.EMAIL_USER}>`,
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

                <div style="background-color: #fdfbf7; padding: 15px; border-radius: 8px; border: 1px solid #f7f2e8;">
                    <p style="margin: 0; color: #5c2c16; font-size: 14px; text-align: center;">
                        Si tienes dudas con tu despacho en La Serena/Coquimbo, contáctanos respondiendo a este correo.
                    </p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✉️ Recibo enviado exitosamente a ${emailCliente}`);
    } catch (error) {
        console.error('❌ Error enviando correo:', error);
    }
};

module.exports = { enviarReciboCompra };