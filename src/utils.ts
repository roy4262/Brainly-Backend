export const randomString = (len: number): string => {
    const options = "qwertyuiopasdfghjklzxcvbnm1234567890";
    const optionsLength = options.length;
    let result = '';

    for (let i = 0; i < len; i++) {
        result += options[Math.floor(Math.random() * optionsLength)];
    }
    
    return result;
}