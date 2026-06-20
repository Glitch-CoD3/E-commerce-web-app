const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

const getOtpHtml = (otp) => {
    return `
        <h1>Your OTP Code</h1>
        <p>Your OTP code is: <strong>${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
    `;
}


export {
    generateOTP,
    getOtpHtml,
}