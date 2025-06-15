// api/questions.js
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get encryption key from environment variable
        const encryptionKey = process.env.QUESTIONS_ENCRYPTION_KEY;
        
        if (!encryptionKey) {
            console.error('Encryption key not found');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Read encrypted file
        const encryptedPath = path.join(process.cwd(), 'data', 'etest.json.enc');
        const encryptedData = fs.readFileSync(encryptedPath);

        // Decrypt the data
        const algorithm = 'aes-256-cbc';
        const key = Buffer.from(encryptionKey, 'hex');
        const iv = encryptedData.slice(0, 16);
        const encrypted = encryptedData.slice(16);

        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]);

        const questions = JSON.parse(decrypted.toString());

        
        if (!req.headers.authorization) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Return decrypted questions
        res.status(200).json(questions);

    } catch (error) {
        console.error('Decryption error:', error);
        res.status(500).json({ error: 'Failed to load questions' });
    }
}

