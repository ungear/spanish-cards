import Database from 'better-sqlite3';
import fs from 'fs';
const db = new Database('./data/cards.db');

// Get the query from command line arguments
const query = process.argv[2];

if (!query) {
    console.error('Please provide a SQL query as an argument');
    process.exit(1);
}

let queryToExecute = query;

// If the query is a migration, read the migration file and execute the query
// expecting the parameter like "migration 2-add-users"
if(query.toLowerCase().startsWith("migration")){
    const migrationName = query.split(" ")[1];
    const migrationFile = `./db/${migrationName}.sql`;
    if(fs.existsSync(migrationFile)){
        console.log(`Executing migration ${migrationName}`);
        queryToExecute = fs.readFileSync(migrationFile, 'utf8');
    } else {
        console.error(`Migration file ${migrationFile} not found`);
        process.exit(1);
    }
}

try {
    const stmt = db.prepare(queryToExecute);
    let results;

    if(
        queryToExecute.toLowerCase().startsWith("alter") 
        || queryToExecute.toLowerCase().startsWith("update")
        || queryToExecute.toLowerCase().startsWith("insert")
        || queryToExecute.toLowerCase().startsWith("delete")
        || queryToExecute.toLowerCase().startsWith("create")
    ){
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