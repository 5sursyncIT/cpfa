<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Abonnement validé</title>
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
			background-color: #46b450;
			color: white;
			padding: 20px;
			text-align: center;
		}
		.content {
			background-color: #f9f9f9;
			padding: 30px;
			border: 1px solid #ddd;
		}
		.success-box {
			background-color: #d4edda;
			border: 2px solid #28a745;
			padding: 20px;
			margin: 20px 0;
			border-radius: 4px;
			text-align: center;
		}
		.info-box {
			background-color: #fff;
			border-left: 4px solid #46b450;
			padding: 15px;
			margin: 20px 0;
		}
		.info-box p {
			margin: 8px 0;
		}
		.download-box {
			background-color: #e7f3ff;
			border: 2px solid #0073aa;
			padding: 20px;
			margin: 20px 0;
			border-radius: 4px;
			text-align: center;
		}
		.btn {
			display: inline-block;
			background-color: #0073aa;
			color: white;
			padding: 12px 30px;
			text-decoration: none;
			border-radius: 4px;
			margin-top: 10px;
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
		<h1>✅ Abonnement Activé !</h1>
	</div>

	<div class="content">
		<h2>Bonjour {prenom} {nom},</h2>

		<div class="success-box">
			<p style="font-size: 18px; margin: 0;">🎉 <strong>Excellente nouvelle !</strong></p>
			<p style="font-size: 16px; margin: 10px 0 0 0;">Votre abonnement bibliothèque a été <strong>VALIDÉ</strong>.</p>
		</div>

		<h3>DÉTAILS DE VOTRE ABONNEMENT :</h3>
		<div class="info-box">
			<p><strong>Type :</strong> {type_abonnement}</p>
			<p><strong>Numéro de carte :</strong> {numero_carte}</p>
			<p><strong>Valable du :</strong> {date_debut} au {date_fin}</p>
		</div>

		<div class="download-box">
			<h3>📄 CARTE MEMBRE</h3>
			<p>Votre carte membre est en pièce jointe de cet email (format PDF).</p>
			<p>Vous pouvez également la télécharger via ce lien :</p>
			<a href="{carte_pdf_url}" class="btn">📥 Télécharger ma carte</a>
			<p style="margin-top: 15px; font-size: 14px;"><em>Présentez cette carte (imprimée ou sur mobile) à chaque visite.</em></p>
			<p style="font-size: 14px;"><em>Le QR code permet de vérifier instantanément votre abonnement.</em></p>
		</div>

		<h3>📍 HORAIRES D'OUVERTURE :</h3>
		<p style="padding-left: 20px;">Lundi - Vendredi : <strong>08:00 - 17:00</strong></p>

		<p style="margin-top: 30px; text-align: center; font-size: 18px;">
			<strong>Bienvenue à la bibliothèque CPFA ! 📚</strong>
		</p>

		<p>Cordialement,<br>
		<strong>L'équipe CPFA</strong></p>
	</div>

	<div class="footer">
		<p>CPFA - Centre de Perfectionnement de la Fonction Administrative</p>
	</div>
</body>
</html>
