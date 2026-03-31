export const generateCertHtml = (member, assets) => {
    // 1. Calculate the Expiry Date (Current Date + 1 Year)
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(now.getFullYear() + 1);

    // Format it nicely (e.g., MARCH 31, 2027)
    const formattedExpiry = expiryDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).toUpperCase();
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">

<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

<style>
* {
  box-sizing: border-box;
  -webkit-print-color-adjust: exact;
}

body {
  margin: 0;
  background: #525659;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* A4 */
.page {
  width: 210mm;
  height: 297mm;
  background: #faf7f2;
  padding: 10mm;
}

/* 🔵 DOUBLE BLUE BORDER */
.outer {
  border: 12px double #1e3a8a;
  padding: 5px;
  height: 100%;
}

/* 🟡 GOLD INNER BORDER */
.inner {
  border: 2px solid #c4a052;
  height: 100%;
  padding: 50px 60px;
  text-align: center;
  position: relative;
}

/* WATERMARK */
.watermark {
  position: absolute;
  width: 650px;
  opacity: 0.05;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* LOGO */
.logo {
  width: 150px;
  height: 150px;
  margin-bottom: 5px;
}

/* TITLE */
.title {
  font-family: 'Playfair Display', serif;
  font-size: 25px;
  font-weight: 900;
  color: #1e3a8a;
  letter-spacing: 1px;
  margin-left: -60px;
  margin-right: -60px;
}

.subtitle {
  margin-top: 8px;
  font-size: 11px;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 1px;
}

/* DIVIDER */
.line {
  width: 80px;
  height: 2px;
  background: #da9c17;
  margin: 15px auto;
}

/* HEADING */
.heading {
  font-family: 'Playfair Display', serif;
  font-size: 25px;
  color: #1e3a8a;
  margin-top: 30px;
}

.desc {
  font-style: italic;
  color: #64748b;
  margin-top: 10px;
  margin-bottom: 20px;
  font-size: 18px;
}

/* IDENTITY */
.identity {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
}

.photo {
  width: 150px;
  height: 150px;
  border: 3px solid #1e3a8a;
  padding: 4px;
}

.photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info {
  margin-left: 40px;
  text-align: left;
}

.name {
  font-size: 30px;
  font-weight: 900;
  color: #da9c17;
  line-height: 1;
  text-transform: uppercase;
}

.location {
  margin-top: 12px;
  font-size: 16px;
  font-weight: 800;
  color: #1e3a8a;
}

/* STATEMENT */
.statement {
  margin-top: 30px;
  margin-bottom: 25px;
  font-size: 18px;
  font-weight: 700;
  color: #1e3a8a;
}

/* GOVT TAG */
.badge {
  margin-top: 15px;
  border: 1px solid #e5e7eb;
  padding: 6px 18px;
  display: inline-block;
  border-radius: 20px;
  font-size: 10px;
  color: #94a3b8;
  font-weight: 800;
}

/* ✅ SEAL FIXED POSITION */
.seal {
  width: 120px;
  margin-top: 15px;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

/* SIGNATURES */
.signatures {
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
}

.sig {
  width: 220px;
  text-align: center;
}

.sig img {
  height: 55px;
}

.sig-line {
  border-top: 2px solid #1e3a8a;
  margin-top: 5px;
}

.sig-name {
  font-weight: 1000;
  margin-top: 8px;
    color: #1e3a8a;
}

.sig-role {
  font-size: 10px;
  color: #1e3a8a;
  font-weight: 800;
}

/* FOOTER */
.footer {
  margin-top: 25px;
  font-size: 10px;
  color: #94a3b8;
  font-weight: 800;
  border-top: 1px solid #eee;
  padding-top: 10px;
  line-height: 1.6;
}
</style>
</head>

<body>

<div class="page">
  <div class="outer">
    <div class="inner">

      <!-- WATERMARK -->
      <img src="${assets.sealBase64}" class="watermark">

      <!-- LOGO -->
      <img src="${assets.logoBase64}" class="logo">

      <!-- TITLE -->
      <div class="title">INDIAN DIGITAL CONTENT CREATORS COUNCIL</div>
      <div class="subtitle">REGISTERED GOVERNMENT OF INDIA NGO • IDCCC FOUNDATION</div>

      <div class="line"></div>

      <!-- HEADING -->
      <div class="heading">CERTIFICATE OF MEMBERSHIP</div>
      <div class="desc">This document serves to officially certify that</div>

      <!-- IDENTITY -->
      <div class="identity">
        <div class="photo">
          <img src="${member.profilePhoto}">
        </div>
        <div class="info">
          <div class="name">${member.fullName.toUpperCase()}</div>
          <div class="location">${member.city}, ${member.state} • INDIA</div>
        </div>
      </div>

      <!-- STATEMENT -->
      <div class="statement">
        Has been admitted as a Verified Professional Member of the Council.
      </div>

      <!-- GOVT TAG -->
      <div class="badge">GOVT. REGD NGO</div>

      <!-- ✅ SEAL UNDER TAG -->
      <img src="${assets.sealBase64}" class="seal">

      <!-- SIGNATURES -->
      <div class="signatures">
        <div class="sig">
          <img src="${assets.sigRegistrar}">
          <div class="sig-line"></div>
          <div class="sig-name">V SOMASEKHAR</div>
          <div class="sig-role">COUNCIL REGISTRAR</div>
        </div>

        <div class="sig">
          <img src="${assets.sigDinesh}">
          <div class="sig-line"></div>
          <div class="sig-name">V DINESH</div>
          <div class="sig-role">GENERAL SECRETARY</div>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        REG NO: ${member.regNumber} | VALID UNTIL: ${formattedExpiry}<br>
        8-385, BANDIMOTU STREET, KURNOOL ROAD, GOOTY R.S, ANANTAPURAMU, ANDHRA PRADESH(AP), INDIA. 515402
      </div>

    </div>
  </div>
</div>

</body>
</html>
    `;
}