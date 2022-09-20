var nodemailer = require("nodemailer");
var Email = require("email-templates");

module.exports = {
	sendMail: async (toEmail, mailSubject, templateName, locale) => {
		const Helper = require("./Helper");
		if (process.env.SEND_EMAIL === "true") {
			const configOption = {
				host: process.env.SMTP_HOST,
				port: process.env.SMTP_PORT,
				secure: false,
				auth: {
					user: process.env.SMTP_USER,
					pass: process.env.SMTP_PASSWORD,
				},				
			};
			const viewPath = "src/views/emails";
			const transporter = await nodemailer.createTransport(configOption);
			const email = new Email({
				transport: transporter,
				send: true,
				preview: false,
				views: {
					options: {
						extension: "ejs",
					},
					root: viewPath,
				},
			});

			let info;
			if (locale.offerLetterUrl) {
				info = await email.send({
					template: templateName,
					message: {
						from: process.env.COMPANY_EMAIL,
						to: toEmail,
						subject: mailSubject,
						attachments: [
							{
								filename: "offerLetter.jpeg",
								path: locale.offerLetterUrl,
								contentType: ["application/pdf", "image/jpeg"],
							},
						],
					},
					locals: locale,
				});
			} else {
				// send mail with defined transport object
				info = await email.send({
					template: templateName,
					message: {
						from:  process.env.COMPANY_EMAIL,
						to: toEmail,
						subject: mailSubject,
					},
					locals: locale,
				});
			}

			if (info) {
				console.log("Message sent: %s", info.messageId);
			}
			console.log(info);
			return info;
		} else {
			return true;
		}
	},
};
