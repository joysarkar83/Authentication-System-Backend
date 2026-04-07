import 'dotenv/config';

const PORT = process.env.PORT || 3000;

const MONGO_URL = process.env.MONGO_URL;
if(!MONGO_URL) {
    throw new Error('MONGO_URL is not present in environment variables!');
}

const JWT_SECRET = process.env.JWT_SECRET;
if(!JWT_SECRET) {
    throw new Error('JWT_SECRET is not present in environment variables!');
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
if(!GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID is not present in environment variables!');
}

const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
if(!GOOGLE_CLIENT_SECRET) {
    throw new Error('GOOGLE_CLIENT_SECRET is not present in environment variables!');
}

const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
if(!GOOGLE_REFRESH_TOKEN) {
    throw new Error('GOOGLE_REFRESH_TOKEN is not present in environment variables!');
}

const GOOGLE_USER = process.env.GOOGLE_USER;
if(!GOOGLE_USER) {
    throw new Error('GOOGLE_USER is not present in environment variables!');
}

const config = {
    PORT,
    MONGO_URL,
    JWT_SECRET,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN,
    GOOGLE_USER
}

export default config;