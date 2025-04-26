import Database from 'better-sqlite3';
const db = new Database('./data/cards.db');

// Get the query from command line arguments
const query = process.argv[2];

if (!query) {
    console.error('Please provide a SQL query as an argument');
    process.exit(1);
}

try {
    const stmt = db.prepare(query);
    let results;
    if(query.toLowerCase().startsWith("alter")){
        results = stmt.run();
    } else{
        results = stmt.all();
    }
    console.log(JSON.stringify(results, null, 2));
} catch (error) {
    console.error('Error executing query:', error.message);
} finally {
    db.close();
} 