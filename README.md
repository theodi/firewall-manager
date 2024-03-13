# Firewall Manager

## Overview

Firewall Manager is a Node.js application that allows users to add and remove firewall rules using the Uncomplicated Firewall (UFW) tool. It provides a simple API endpoint to add or remove firewall rules based on the provided IP address and email.

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:

   ```bash
   cd firewall-manager
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

## Usage

1. Start the application:

   ```bash
   npm start
   ```

2. Make a POST request to the `/firewall` endpoint with the following JSON payload:

   ```json
   {
       "ip": "192.168.1.1",
       "email": "example@example.com"
   }
   ```

   This will add or remove firewall rules as necessary.

## Important Note

**Warning:** Running this application can modify your firewall rules, potentially exposing your system to security risks if not used carefully. It is strongly recommended to limit access to this application either by firewall rules or by implementing authentication mechanisms.

## Limiting Access

To limit access to the Firewall Manager application:

- Use firewall rules to restrict incoming connections to the server hosting the application. Only allow connections from trusted IP addresses.
- Implement authentication mechanisms such as API keys or OAuth to authenticate users before allowing them to access the application.

## Port Restrictions

Please note that the Firewall Manager application is hardcoded to manage access to ports 80 and 443 only.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, feel free to open an issue or create a pull request.

## License

This project is licensed under the [MIT License](LICENSE).