<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Nouvelle préinscription</title>
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
		.info-box {
			background-color: #fff;
			border-left: 4px solid #d63638;
			padding: 15px;
			margin: 20px 0;
		}
		.info-box p {
			margin: 8px 0;
		}
		.action-box {
			background-color: #fff3cd;
			border: 2px solid #ffc107;
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
		<h1>⚠️ CPFA Admin - Nouvelle Préinscription</h1>
	</div>

	<div class="content">
		<h2>Nouvelle préinscription bibliothèque à valider :</h2>

		<div class="info-box">
			<p><strong>NOM :</strong> {nom} {prenom}</p>
			<p><strong>TYPE :</strong> {type_abonnement} ({montant} FCFA)</p>
			<p><strong>EMAIL :</strong> {email}</p>
			<p><strong>TÉLÉPHONE :</strong> {telephone}</p>
		</div>

		<div class="action-box">
			<p><strong>🔔 ACTION REQUISE :</strong></p>
			<ol style="text-align: left; display: inline-block;">
				<li>Vérifier la réception du paiement dans votre interface Wave/Orange Money</li>
				<li>Cliquer sur le lien ci-dessous pour valider ou rejeter</li>
			</ol>
			<a href="{lien_admin}" class="btn">📋 Voir la préinscription</a>
		</div>

		<p><em>Rappel : Délai de validation recommandé sous 24-48h ouvrées.</em></p>
	</div>

	<div class="footer">
		<p>CPFA - Interface d'administration</p>
	</div>
</body>
</html>
