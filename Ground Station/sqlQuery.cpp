#include <pqxx/pqxx>
#include <iostream>
#include <fstream>
#include <sstream>

//int main() {
int logTodb(){
    std::cout << "Connecting to database..." << std::endl;

// Database connection parameters
    const std::string dbname = "astro";
    const std::string user = "astro";
    const std::string password = "";
    const std::string host = "ider-database.westeurope.cloudapp.azure.com";
    const std::string port = "5433";

    // Connection string
    const std::string conninfo =
        "host=" + host +
        " port=" + port +
        " dbname=" + dbname +
        " user=" + user +
        " password=" + password;

    try {
        // Establish connection
        pqxx::connection conn(conninfo);

        if (!conn.is_open()) {
            std::cerr << "Failed to connect to database." << std::endl;
            return 1;
        }

        std::cout << "Connected to database: " << conn.dbname() << std::endl;

        pqxx::work txn(conn);
        std::ifstream file("/Users/magnusfondenes/Desktop/Avionikk/sql/data.csv");

        if (!file.is_open()) {
            std::cerr << "Cannot open CSV file\n";
            return 1;
        }

        std::string line;
        bool header = true;

        while (std::getline(file, line)) {
            if (header) {
                header = false;
                continue;
            }

            std::stringstream ss(line);
            std::string rocket_id, pitch, yaw, roll, velocity, altitude, temperature, pressure, time_ms;

            std::getline(ss, rocket_id, ',');
            std::getline(ss, pitch, ',');
            std::getline(ss, yaw, ',');
            std::getline(ss, roll, ',');
            std::getline(ss, velocity, ',');
            std::getline(ss, altitude, ',');
            std::getline(ss, temperature, ',');
            std::getline(ss, pressure, ',');
            std::getline(ss, time_ms, ',');

            txn.exec_params(
                "INSERT INTO avionic (rocket_id, pitch, yaw, roll, velocity, altitude, temperature, pressure, time_ms) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
                rocket_id, pitch, yaw, roll, velocity, altitude, temperature, pressure, time_ms
            );
        }

        txn.commit();
        std::cout << "✅ CSV data inserted successfully!" << std::endl;

    } catch (const std::exception &e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}


/*#include <iostream>

// Forward declaration (so the compiler knows about your function)
int logToDb();

int main() {
    std::cout << "🚀 Avionics program started.\n";

    // --- Your main program logic here ---
    // e.g., collect sensor data, compute values, save CSV, etc.
    std::cout << "Running main operations...\n";

    // --- Upload data to the database ---
    std::cout << "Uploading data to database...\n";
    int result = logToDb();

    if (result != 0) {
        std::cerr << "⚠️  Failed to log data to the database.\n";
        // You can decide if this should stop the program or just warn
        // return 1;  // Uncomment if DB upload failure should end the program
    } else {
        std::cout << "✅ Data successfully logged to the database.\n";
    }

    std::cout << "🏁 Program finished.\n";
    return 0;
}

}*/
