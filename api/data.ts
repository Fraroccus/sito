import fs from 'fs';
import path from 'path';

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const filePath = path.join(process.cwd(), 'db.json');
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf-8');
      return res.status(200).send(fileData);
    }
  } catch (err) {
    // Fallback if filesystem read is not available on serverless
  }

  return res.status(200).json({
    percorsi: [],
    collaborations: [],
    progetti: [
      {
        id: "progetto-1789831502978",
        title: "NeuroMechFly Tris",
        category: "Intelligenza Artificiale",
        description: "Una semplice interfaccia che permette di giocare a tris contro il connettoma di una Drosophila Melanogaster, visualizzando in tempo reale l'attivazione cerebrale per ciascuna decisione.",
        image: "/neuromechfly.jpg",
        gradientIndex: 1,
        tags: ["Drosophila", "Reti Neurali", "Three.js", "Gamification"],
        period: "2024",
        client: "Progetto Personale & Ricerca",
        linkUrl: "/neuromechfly-tris/",
        linkText: "Vedi progetto",
        githubUrl: "https://github.com/Fraroccus/moscatris",
        isExample: false,
        created_at: "2026-09-19T15:25:02.978Z"
      }
    ]
  });
}
