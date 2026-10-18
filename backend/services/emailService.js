/**
 * ============================================================================
 * SERVICIO DE CORREOS Y GENERACIÓN DE PDF
 * ============================================================================
 * Envía el correo mediante Resend y genera un comprobante PDF "al vuelo"
 * en memoria RAM (sin guardar en disco) para adjuntarlo.
 */

const { Resend } = require('resend');
const PDFDocument = require('pdfkit'); // <-- Nueva librería para PDF

const resend = new Resend(process.env.RESEND_API_KEY);

// --- FUNCIÓN INTERNA PARA DIBUJAR EL PDF ---
const generarPDFBuffer = (ordenId, nombreCliente, items, total) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        let buffers = [];

        // Capturamos los datos mientras se crea el PDF en memoria
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        // 1. Cabecera del Comprobante
        doc.fontSize(24).fillColor('#b45309').text('NutraNuts', { align: 'center' });
        doc.fontSize(10).fillColor('#6b7280').text('La Serena - Coquimbo, Chile', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).fillColor('#1f2937').text('Comprobante de Compra', { align: 'center' });
        doc.moveDown(2);

        // 2. Datos del Cliente y Orden
        doc.fontSize(12).fillColor('#374151');
        doc.text(`Orden #: ${ordenId}`);
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`);
        doc.text(`Cliente: ${nombreCliente}`);
        doc.moveDown(2);

        // 3. Tabla de Productos (Textos simples)
        doc.fontSize(14).fillColor('#1f2937').text('Detalle de los productos:');
        doc.moveDown(0.5);
        
        doc.fontSize(12).fillColor('#374151');
        items.forEach(item => {
            const subtotal = item.price * item.quantity;
            doc.text(`${item.quantity}x ${item.name} ........................ $${subtotal.toLocaleString('es-CL')}`);
        });

        // 4. Total Final
        doc.moveDown(2);
        const totalStr = Number(total).toLocaleString('es-CL');
        doc.fontSize(16).fillColor('#b45309').text(`TOTAL PAGADO: $${totalStr}`, { align: 'right' });

        // 5. Pie de página
        doc.moveDown(4);
        doc.fontSize(10).fillColor('#9ca3af').text('Gracias por preferir la alimentación consciente y natural.', { align: 'center' });

        // Finalizar el documento
        doc.end();
    });
};

// --- FUNCIÓN PRINCIPAL PARA ENVIAR EL CORREO ---
const enviarReciboCompra = async (emailCliente, nombreCliente, ordenId, items, total) => {
    if (!emailCliente) return;

    // Generamos el HTML para el cuerpo del correo
    const listaProductosHTML = items.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}x ${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.price * item.quantity).toLocaleString('es-CL')}</td>
        </tr>
    `).join('');

    const totalFormateado = Number(total).toLocaleString('es-CL');

    try {
        // Generamos el PDF y esperamos a que el Buffer esté listo
        const pdfBuffer = await generarPDFBuffer(ordenId, nombreCliente, items, total);

        // Enviamos el correo con Resend
        const data = await resend.emails.send({
            from: 'NutraNuts <onboarding@resend.dev>', // Recuerda cambiar esto cuando tengas un dominio verificado
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

                    <p style="color: #374151; font-size: 14px;"><em>* Hemos adjuntado a este correo un PDF con el comprobante de tu compra.</em></p>
                </div>
            `,
            // AQUÍ ADJUNTAMOS EL PDF
            attachments: [
                {
                    filename: `Comprobante_NutraNuts_Orden_${ordenId}.pdf`,
                    content: pdfBuffer,
                }
            ]
        });

        console.log(`✉️ Recibo con PDF enviado exitosamente a ${emailCliente}`);
    } catch (error) {
        console.error('❌ Error enviando correo por API:', error);
    }
};

module.exports = { enviarReciboCompra };