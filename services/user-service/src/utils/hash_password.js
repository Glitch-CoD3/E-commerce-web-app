import bcrypt from 'bcrypt';

const hashPassword = async (password) => {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}


const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};



const hashPhoneNumber = async (phone_number) => {
    const saltRounds = 10;
    const hashedPhoneNumber = await bcrypt.hash(phone_number, saltRounds);
    return hashedPhoneNumber;
}

const comparePhoneNumber = async (phone_number, hashedPhoneNumber) => {
    return await bcrypt.compare(phone_number, hashedPhoneNumber);
}

export { hashPassword, comparePassword, hashPhoneNumber, comparePhoneNumber };