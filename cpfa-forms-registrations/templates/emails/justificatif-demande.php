<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Justificatif de paiement requis</title>
	<style>
		body {
			font-family: Arial, sans-serif;
			line-height: 1.6;
			color: #333;
			max-width: 600px;
			margin: 0 auto;
			padding: 20px;
		}
		.header {
			background-color: #ffc107;
			color: #333;
			padding: 20px;
			text-align: center;
		}
		.content {
			background-color: #f9f9f9;
			padding: 30px;
			border: 1px solid #ddd;
		}
		.info-box {
			background-color: #fff;
			border-left: 4px solid #ffc107;
			padding: 15px;
			margin: 20px 0;
		}
		.request-box {
			background-color: #fff3cd;
			border: 2px solid #ffc107;
			padding: 20px;
			margin: 20px 0;
			border-radius: 4px;
		}
		.request-box ul {
			margin: 10px 0;
			padding-left: 20px;
		}
		.footer {
			text-align: center;
			padding: 20px;
			color: #666;
			font-size: 12px;
		}
	</style>
</head>
<body>
	<div class="header">
		<h1>⚠️ CPFA - Justificatif Requis</h1>
	</div>

	<div class="content">
		<h2>Bonjour {prenom} {nom},</h2>

		<p>Concernant votre préinscription <strong>n°{numero_preinscription}</strong>,</p>

		<div class="info-box">
			<p>Nous n'avons pas encore pu confirmer la réception de votre paiement.</p>
		</div>

		<?php if ( ! empty( $variables['custom_message'] ) ) : ?>
		<div class="request-box">
			<p><strong>Message de l'administrateur :</strong></p>
			<p>{custom_message}</p>
		</div>
		<?php endif; ?>

		<div class="request-box">
			<h3>📄 MERCI DE NOUS TRANSMETTRE :</h3>
			<ul>
				<li>Capture d'écran de la transaction Wave ou Orange Money</li>
				<li>Référence de transaction</li>
				<li>Date et heure du paiement</li>
			</ul>
		</div>

		<p><strong>Vous pouvez répondre directement à cet email avec ces éléments.</strong></p>

		<p>Une fois le justificatif reçu, nous validerons votre abonnement sous 24h.</p>

		<p>Cordialement,<br>
		<strong>L'équipe CPFA</strong></p>
	</div>

	<div class="footer">
		<p>CPFA - Centre de Perfectionnement de la Fonction Administrative</p>
		<p>Email : {contact_email}</p>
	</div>
</body>
</html>
