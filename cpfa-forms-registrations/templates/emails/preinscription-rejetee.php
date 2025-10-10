<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Préinscription rejetée</title>
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
			background-color: #d63638;
			color: white;
			padding: 20px;
			text-align: center;
		}
		.content {
			background-color: #f9f9f9;
			padding: 30px;
			border: 1px solid #ddd;
		}
		.warning-box {
			background-color: #fff3cd;
			border: 2px solid #ffc107;
			padding: 20px;
			margin: 20px 0;
			border-radius: 4px;
		}
		.info-box {
			background-color: #fff;
			border-left: 4px solid #d63638;
			padding: 15px;
			margin: 20px 0;
		}
		.contact-box {
			background-color: #e7f3ff;
			border: 1px solid #0073aa;
			padding: 15px;
			margin: 20px 0;
			border-radius: 4px;
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
		<h1>CPFA - Action Requise</h1>
	</div>

	<div class="content">
		<h2>Bonjour {prenom} {nom},</h2>

		<p>Nous avons examiné votre demande d'abonnement bibliothèque.</p>

		<div class="warning-box">
			<p><strong>STATUT :</strong> REJETÉE</p>
		</div>

		<div class="info-box">
			<p><strong>MOTIF :</strong> {motif_rejet}</p>
			<?php if ( ! empty( $variables['details_rejet'] ) ) : ?>
			<p><strong>DÉTAILS :</strong></p>
			<p>{details_rejet}</p>
			<?php endif; ?>
		</div>

		<h3>PROCHAINES ÉTAPES :</h3>
		<ul>
			<li>Si vous avez effectué le paiement, merci de nous transmettre la référence de transaction</li>
			<li>Vous pouvez nous contacter pour régulariser votre dossier</li>
		</ul>

		<div class="contact-box">
			<h3>📞 CONTACT :</h3>
			<p><strong>Email :</strong> {contact_email}</p>
			<p><strong>Téléphone :</strong> {contact_telephone}</p>
		</div>

		<p>Nous restons à votre disposition pour toute clarification.</p>

		<p>Cordialement,<br>
		<strong>L'équipe CPFA</strong></p>
	</div>

	<div class="footer">
		<p>CPFA - Centre de Perfectionnement de la Fonction Administrative</p>
	</div>
</body>
</html>
