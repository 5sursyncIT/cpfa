<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="UTF-8">
	<title>Carte Membre CPFA</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}

		body {
			font-family: 'DejaVu Sans', sans-serif;
			font-size: 8pt;
			width: 85.6mm;
			height: 54mm;
			margin: 0;
			padding: 0;
		}

		/* Recto */
		.card {
			width: 100%;
			height: 100%;
			position: relative;
			background: linear-gradient(135deg, <?php echo esc_attr( $colors['primary'] ); ?> 0%, <?php echo esc_attr( $colors['secondary'] ); ?> 100%);
			color: #ffffff;
			overflow: hidden;
		}

		.card-header {
			background: rgba(255, 255, 255, 0.15);
			padding: 4mm 3mm;
			text-align: center;
			border-bottom: 2px solid rgba(255, 255, 255, 0.3);
		}

		.card-header h1 {
			font-size: 14pt;
			font-weight: bold;
			margin: 0;
			text-transform: uppercase;
			letter-spacing: 1px;
		}

		.card-header p {
			font-size: 8pt;
			margin: 1mm 0 0 0;
			opacity: 0.9;
		}

		.card-body {
			padding: 3mm;
			display: table;
			width: 100%;
		}

		.photo-section {
			display: table-cell;
			width: 20mm;
			vertical-align: middle;
			padding-right: 3mm;
		}

		.photo {
			width: 18mm;
			height: 22mm;
			border: 2px solid #ffffff;
			border-radius: 2mm;
			background: #ffffff;
			overflow: hidden;
		}

		.photo img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		.info-section {
			display: table-cell;
			vertical-align: middle;
		}

		.info-row {
			margin-bottom: 1.5mm;
		}

		.info-label {
			font-size: 6pt;
			opacity: 0.8;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}

		.info-value {
			font-size: 9pt;
			font-weight: bold;
			margin-top: 0.5mm;
		}

		.qr-section {
			display: table-cell;
			width: 18mm;
			vertical-align: middle;
			text-align: center;
			padding-left: 2mm;
		}

		.qr-code {
			width: 16mm;
			height: 16mm;
			background: #ffffff;
			padding: 1mm;
			border-radius: 1mm;
		}

		.qr-code img {
			width: 100%;
			height: 100%;
		}

		.qr-label {
			font-size: 5pt;
			margin-top: 1mm;
			opacity: 0.8;
		}

		.card-footer {
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			background: rgba(0, 0, 0, 0.2);
			padding: 1.5mm 3mm;
			display: table;
			width: 100%;
		}

		.footer-left {
			display: table-cell;
			font-size: 6pt;
			vertical-align: middle;
		}

		.footer-right {
			display: table-cell;
			text-align: right;
			font-size: 6pt;
			vertical-align: middle;
		}

		.badge {
			display: inline-block;
			background: <?php echo esc_attr( $colors['accent'] ); ?>;
			color: #333;
			padding: 1mm 2mm;
			border-radius: 2mm;
			font-weight: bold;
			font-size: 7pt;
		}

		/* Decorative elements */
		.decoration {
			position: absolute;
			width: 30mm;
			height: 30mm;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.05);
		}

		.decoration-1 {
			top: -15mm;
			right: -15mm;
		}

		.decoration-2 {
			bottom: -15mm;
			left: -10mm;
		}
	</style>
</head>
<body>
	<div class="card">
		<!-- Decorative circles -->
		<div class="decoration decoration-1"></div>
		<div class="decoration decoration-2"></div>

		<!-- Header -->
		<div class="card-header">
			<h1>CPFA</h1>
			<p>Carte Membre Bibliothèque</p>
		</div>

		<!-- Body -->
		<div class="card-body">
			<!-- Photo -->
			<div class="photo-section">
				<div class="photo">
					<?php if ( ! empty( $photo_url ) ) : ?>
						<img src="<?php echo esc_url( $photo_url ); ?>" alt="Photo">
					<?php endif; ?>
				</div>
			</div>

			<!-- Info -->
			<div class="info-section">
				<div class="info-row">
					<div class="info-label">Nom</div>
					<div class="info-value"><?php echo esc_html( $prenom . ' ' . $nom ); ?></div>
				</div>

				<div class="info-row">
					<div class="info-label">Type</div>
					<div class="info-value">
						<span class="badge"><?php echo esc_html( $type ); ?></span>
					</div>
				</div>

				<div class="info-row">
					<div class="info-label">N° Carte</div>
					<div class="info-value"><?php echo esc_html( $numero_carte ); ?></div>
				</div>
			</div>

			<!-- QR Code -->
			<?php if ( ! empty( $qr_code ) ) : ?>
				<div class="qr-section">
					<div class="qr-code">
						<img src="<?php echo esc_attr( $qr_code ); ?>" alt="QR Code">
					</div>
					<div class="qr-label">SCAN</div>
				</div>
			<?php endif; ?>
		</div>

		<!-- Footer -->
		<div class="card-footer">
			<div class="footer-left">
				Valide du <?php echo esc_html( $date_debut ); ?>
			</div>
			<div class="footer-right">
				au <?php echo esc_html( $date_fin ); ?>
			</div>
		</div>
	</div>
</body>
</html>
