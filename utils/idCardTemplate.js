export const generateIdCardHtml = (member, assets) => {
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(now.getFullYear() + 1);

    const formattedExpiry = expiryDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).toUpperCase();

    const qrSrc = assets?.qrCodeBase64 || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${member.regNumber}`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

        body { 
            margin: 0; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh;
            background: #f1f5f9;
            font-family: 'Plus Jakarta Sans', sans-serif; 
        }

        /* Card size increased by 10% */
        .id-card { 
            width: 59.4mm; 
            height: 94.6mm; 
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(12px) saturate(180%);
            -webkit-backdrop-filter: blur(12px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.6);
            border-radius: 22px;
            box-shadow: 0 12px 35px rgba(0, 0, 0, 0.06);
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 12px 10px 10px 10px;
            box-sizing: border-box;
            position: relative;
            overflow: hidden;
        }

        .header { 
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            margin-bottom: 8px;
            width: 100%;
        }

        .logo { 
            width: 45px; 
            height: 45px; 
            object-fit: contain;
            margin-bottom: 4px;
        }

        .brand-main { 
            font-weight: 800; 
            font-size: 11.5pt; 
            color: #1e3a8a; 
            line-height: 1;
            margin-bottom: 2px;
            letter-spacing: -0.2px;
        }

        .brand-council {
            font-size: 4.2pt;
            color: #4338ca;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            line-height: 1.1;
            opacity: 0.8;
        }

        .photo-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 6px;
            position: relative;
        }

        .photo { 
            width: 82px; 
            height: 82px; 
            border-radius: 15px; 
            object-fit: cover; 
            border: 2px solid white;
            box-shadow: 0 6px 14px rgba(0,0,0,0.08);
        }

        .status-badge {
            position: absolute;
            bottom: -8px;
            background: ${member.isActive ? '#10b981' : '#f43f5e'};
            color: white;
            font-size: 4.5pt;
            font-weight: 800;
            padding: 2px 10px;
            border-radius: 50px;
            text-transform: uppercase;
            border: 2px solid white;
            box-shadow: 0 3px 6px rgba(0,0,0,0.1);
        }

        .info {
            text-align: center;
            width: 100%;
            margin-top: 10px;
        }

        .name { 
            font-size: 10.5pt; 
            font-weight: 800; 
            color: #0f172a; 
            margin: 0 0 6px 0;
            line-height: 1.1;
        }

        .data-grid {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .data-row {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .label { 
            font-size: 4pt; 
            text-transform: uppercase; 
            color: #94a3b8; 
            font-weight: 700; 
            letter-spacing: 0.5px;
        }

        .value { 
            font-size: 7pt; 
            font-weight: 600; 
            color: #334155; 
            line-height: 1.1;
        }

        .footer {
            margin-top: auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            padding-top: 6px;
            border-top: 1px dashed rgba(0,0,0,0.08);
        }

        .qr-code {
            width: 34px; 
            height: 34px; 
            margin-bottom: 4px;
            background: white;
            padding: 2px;
            border-radius: 6px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }

        .url {
            font-size: 4.2pt;
            font-weight: 700;
            color: #cbd5e1;
            letter-spacing: 0.8px;
        }
    </style>
</head>
<body>
    <div class="id-card">
        <div class="header">
            <img src="${assets.logoBase64}" class="logo" alt="IDCCC">
            <div class="brand-main">IDCCC</div>
            <div class="brand-council">Indian Digital Content Creators Council</div>
        </div>

        <div class="photo-section">
            <img src="${member.profilePhoto}" class="photo" alt="Member">
            <div class="status-badge">${member.isActive ? 'Active' : 'Inactive'}</div>
        </div>

        <div class="info">
            <h1 class="name">${member.fullName.toUpperCase()}</h1>
            
            <div class="data-grid">
                <div class="data-row">
                    <span class="label">Registration ID</span>
                    <span class="value">${member.regNumber}</span>
                </div>
                <div class="data-row">
                    <span class="label">Creator Type</span>
                    <span class="value">${member.creatorType}</span>
                </div>
                <div class="data-row">
                    <span class="label">Validity</span>
                    <span class="value">${formattedExpiry}</span>
                </div>
            </div>
        </div>

        <div class="footer">
            <img src="${qrSrc}" class="qr-code" alt="QR">
            <span class="url">WWW.IDCCC.ORG.IN</span>
        </div>
    </div>
</body>
</html>`;
};