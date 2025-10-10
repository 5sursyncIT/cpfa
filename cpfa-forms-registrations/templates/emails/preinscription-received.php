<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Préinscription reçue</title>
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
			background-color: #0073aa;
			color: white;
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
			border-left: 4px solid #0073aa;
			padding: 15px;
			margin: 20px 0;
		}
		.info-box strong {
			display: inline-block;
			width: 180px;
		}
		.status {
			background-color: #fff3cd;
			border: 1px solid #ffc107;
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
		<h1>CPFA - Centre de Perfectionnement de la Fonction Administrative</h1>
	</div>

	<div class="content">
		<h2>Bonjour {prenom} {nom},</h2>

		<p>Nous avons bien reçu votre demande d'abonnement bibliothèque :</p>

		<div class="info-box">
			<p><strong>Type :</strong> {type_abonnement}</p>
			<p><strong>Montant :</strong> {montant}</p>
			<p><strong>Numéro de préinscription :</strong> {numero_preinscription}</p>
			<p><strong>Date de soumission :</strong> {date_soumission}</p>
		</div>

		<div class="status">
			<p><strong>⏳ Votre préinscription est actuellement EN ATTENTE DE VALIDATION.</strong></p>
			<p>Notre équipe vérifie la réception de votre paiement.</p>
		</div>

		<p>Vous recevrez un email de confirmation sous <strong>24-48h ouvrées</strong>.</p>

		<p>Si vous avez effectué le paiement et conservé une référence de transaction, vous pouvez la communiquer en répondant à cet email.</p>

		<p>Cordialement,<br>
		<strong>L'équipe CPFA</strong></p>
	</div>

	<div class="footer">
		<p>CPFA - Centre de Perfectionnement de la Fonction Administrative</p>
		<p>Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.</p>
	</div>
</body>
</html>
