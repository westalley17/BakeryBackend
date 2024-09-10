// HINT: anything that says ID... just get ready for GUIDs

/*
    HERE LIES ALL THE CLASSES THAT WE WILL BE MAKING OBJECTS OUT OF THROUGHOUT
    OUR BACKEND... it's a lot
    
    Email Class:
    - The `Email` class will be used when creating and managing user emails. It will track email addresses for each user, including whether an email is valid and its type (e.g., work, personal).
    - In the future, routes to add and validate emails could be created, using this class to store the relevant information.
    
    PhoneNumber Class:
    - The `PhoneNumber` class is responsible for capturing phone numbers associated with a user. Each phone number will have a type (e.g., mobile, work) and a flag indicating whether the number is valid.
    - Use this for adding/removing phone numbers or updating their validation status.
    
    InventoryItem Class:
    - The `InventoryItem` class handles the tracking of items in inventory, including quantities, associated employees, and other relevant details like cost and expiration dates.
    - This class will be used in inventory-related features such as adding new items, tracking changes, and setting reorder amounts.

    Ingredient Class:
    - The `Ingredient` class tracks the details of each ingredient (description, category, and measurements). This will be important for managing the kitchen or storage inventories.
    - It might be expanded with routes to fetch, add, or update ingredients.

    Session Class:
    - The `Session` class manages session information for each logged-in user. It's linked to a user by `EmployeeID`. Whenever a user logs in or out, a new session is created or removed.
*/

// User class to group our user data together.
class User {
    constructor(emp_id, firstname, lastname, username, password, userType) {
        this.Emp_ID = emp_id; // Primary Key
        this.FirstName = firstname;
        this.LastName = lastname;
        this.Username = username;
        this.Password = password;
        this.UserType = userType; // Manager or Employee
    }
}

class Session {
    constructor(sess_id, emp_id) {
        this.SessionID = sess_id; // Primary
        this.EmployeeID = emp_id; // Foreign to tblUser
    }
}

class Email {
    constructor(email_id, emailAddress, user_id, type, valid) {
        this.EmailID = email_id; // Primary
        this.EmailAddress = emailAddress;
        this.UserID = user_id;
        this.Type = type; // EmailType
        this.Valid = valid;
    }
}

class EmailType {
    constructor(type_id, desc, active) {
        this.TypeID = type_id; // Primary
        this.Description = desc;
        this.Active = active;
    }
}

class PhoneNumber {
    constructor(phone_num_id, areaCode, number, type, valid, user_id) {
        this.PhoneNumberID = phone_num_id; // Primary
        this.AreaCode = areaCode;
        this.Number = number;
        this.Type = type; // PhoneType
        this.Valid = valid;
        this.UserID = user_id; // genuinely no clue what this is about
    }
}

class PhoneType {
    constructor(type_id, desc, active) {
        this.TypeID = type_id; // Primary
        this.Description = desc;
        this.Active = active;
    }
}

class Ingredient {
    constructor(ing_id, desc, cat, measurement, maxAmt, reorderAmt, minAmt) {
        this.IngredientID = ing_id;
        this.Description = desc;
        this.Category = cat;
        this.Measurement = measurement;
        this.MaxAmount = maxAmt;
        this.ReorderAmount = reorderAmt;
        this.MinAmount = minAmt;
    }
}

class InventoryItem {
    constructor(entry_id, quantity, emp_id, notes, cost, addDate, expDate, PO_num, recipe_id) {
        this.EntryID = entry_id;
        this.Quantity = quantity;
        this.EmployeeID = emp_id;
        this.Notes = notes;
        this.Cost = cost;
        this.AddDate = addDate;
        this.ExpDate = expDate;
        this.PONumber = PO_num;
        this.RecipeID = recipe_id;
    }
}

// Required modules
const express = require('express');
const session = require('express-session');
const uuid = require('uuid');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require('mssql'); // MS SQL Server
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MS SQL Server connection configuration
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, // e.g., 'localhost'
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // for Azure
        trustServerCertificate: true // set to true for local development with self-signed certs
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Initialize connection pool
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

// Session management
app.use(session({
    genid: () => uuid.v4(),
    secret: process.env.SESSION_SECRET, // Use environment variable
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Ensure secure in production
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// Function to create tables (run once during setup)
async function createTables() {
    try {
        await poolConnect; // Ensure the pool is connected
        const request = pool.request();

        // Create tblUser
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblUser')
            CREATE TABLE tblUser (
                EmployeeID NVARCHAR(50) PRIMARY KEY,
                FirstName NVARCHAR(50) NOT NULL,
                LastName NVARCHAR(50) NOT NULL,
                Username NVARCHAR(20) NOT NULL,
                Password NVARCHAR(255) NOT NULL,
                UserType BIT NOT NULL
            )
        `);

        // IDCreateDate DATETIME DEFAULT GETDATE(), use this for sprint 2 or 3 in case we need to add it to the sessions table
        // Create tblSession
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblSession')
            CREATE TABLE tblSession (
                SessionID NVARCHAR(50) PRIMARY KEY,
                EmployeeID NVARCHAR(50) NOT NULL,
                FOREIGN KEY (EmployeeID) REFERENCES tblUser(EmployeeID) ON DELETE CASCADE
            )
        `);
        

        // If you run into trouble with any of the next 12 tables please yell at Dan  -Dan
        // Create tblIngredientCategory
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblIngredientCategory')
            CREATE TABLE tblIngredientCategory (
                IngredientCategoryID NVARCHAR(50) PRIMARY KEY,
                Name NVARCHAR(50) NOT NULL,
                Description NVARCHAR(50) NOT NULL
            )
        `);

        // Create tblIngredient
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblIngredient')
            CREATE TABLE tblIngredient (
                IngredientID NVARCHAR(50) PRIMARY KEY,
                Name NVARCHAR(50) NOT NULL,
                Description NVARCHAR(50) NOT NULL,
                IngredientCategoryID NVARCHAR(50) NOT NULL,
                Measurement NVARCHAR(50) NOT NULL,
                MaxAmount FLOAT(6,2) NOT NULL,
                ReorderAmount FLOAT(6,2) NOT NULL,
                MinAmount FLOAT(6,2) NOT NULL,
                Allergen BIT NOT NULL,
                FOREIGN KEY (IngredientCategoryID) REFERENCES tblIngredientCategory(IngredientCategoryID) ON DELETE CASCADE
            )
        `);

        // Create tblInventory
        // Actually how much we have of each ingredient
        // PONumber might go depending on scope
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblInventory')
            CREATE TABLE tblInventory (
                EntityID NVARCHAR(50) PRIMARY KEY,
                IngredientID NVARCHAR(50) NOT NULL,
                Quantity FLOAT(6,2) NOT NULL,
                EmployeeID NVARCHAR(50) NOT NULL,
                Notes NVARCHAR(50),
                Cost FLOAT(6,2) NOT NULL,
                CreateDateTime DATETIME NOT NULL,
                ExpireDateTime NOT NULL,
                PONumber NVARCHAR(50),
                FOREIGN KEY (IngredientID) REFERENCES tblIngredient(IngredientID) ON DELETE CASCADE,
                FOREIGN KEY (EmployeeID) REFERENCES tblUser(EmployeeID)
            )
        `);
        

        // Create tblProductCategory
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblProductCategory')
            CREATE TABLE tblProductCategory (
                ProductCategoryID NVARCHAR(50) PRIMARY KEY,
                Name NVARCHAR(50) NOT NULL,
                Description NVARCHAR(50) NOT NULL,
            )
        `);
        
        // Create tblProduct
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblProduct')
            CREATE TABLE tblProduct (
                ProductID NVARCHAR(50) PRIMARY KEY,
                Name NVARCHAR(50) NOT NULL,
                Description NVARCHAR(50) NOT NULL,
                ProductCategoryID NVARCHAR(50) NOT NULL,
                FOREIGN KEY (ProductCategoryID) REFERENCES tblProductCategory(ProductCategory) ON DELETE CASCADE
            )
        `);

        // Create tblStock
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblStock')
            CREATE TABLE tblStock (
                StockID NVARCHAR(50) PRIMARY KEY,
                ProductID NVARCHAR(50) NOT NULL,
                CreateDateTime DATETIME NOT NULL,
                ExpireDateTime DATETIME NOT NULL,
                Amount FLOAT(6,2),
                FOREIGN KEY (ProductID) REFERENCES tblProduct(ProductID)
            )
        `);

        // Create tblRecipe
        // Recipe References a Product to make, which references a ProductCategory
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblRecipe')
            CREATE TABLE tblRecipe (
                RecipeID NVARCHAR(50) PRIMARY KEY,
                Name NVARCHAR(50) NOT NULL,
                Notes NVARCHAR(50),
                YieldAmount INT NOT NULL,
                ProductID NVARCHAR(50) NOT NULL,
                PrepTime TIME NOT NULL,
                BakeTime TIME NOT NULL,
                FOREIGN KEY (ProductID) REFERENCES tblProduct(ProductID) ON DELETE CASCADE
            )
        `);

        // Create tblStorefront
        // Keeps count of how much we have to sell out on the storefront using trigger to get count of tblStock, maybe not needed?
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblStorefront')
            CREATE TABLE tblStorefront (
                StorefrontID NVARCHAR(50) PRIMARY KEY,
                CurrentAmount INT NOT NULL,
                RestockAmount INT NOT NULL,
                MinAmount INT NOT NULL
            )
        `);
        
        // Create tblEquipment
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblEquipment')
            CREATE TABLE tblEquipment (
                EquipmentID NVARCHAR(50) PRIMARY KEY,
                Name NVARCHAR(50) NOT NULL,
                Description NVARCHAR(50) NOT NULL,
                Notes NVARCHAR(50) NOT NULL
            )
        `);

        // Create tblKitchenEquipment
        // Provides similar relationship as tblInventory does to tblIngredient
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblKitchenEquipment')
            CREATE TABLE tblKitchenEquipment (
                KitchenEquipmentID NVARCHAR(50) PRIMARY KEY,
                EquipmentID NVARCHAR(50) NOT NULL,
                Name NVARCHAR(50) NOT NULL,
                Status NVARCHAR(50) NOT NULL,
                SerialNumber NVARCHAR(50) NOT NULL,
                Notes NVARCHAR(50),
                FOREIGN KEY (EquipmentID) REFERENCES tblEquipment(EquipmentID)
            )
        `);
        
        // Create tblRecipeIngredient
        // Connects tblRecipe and tblIngredient, says what ingredients go to what recipe
        // foreign constraints for these next two might be weird
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblRecipeIngredient')
            CREATE TABLE tblRecipeIngredient (
                RecipeID NVARCHAR(50) NOT NULL,
                IngredientID NVARCHAR(50) NOT NULL,
                Quantity FLOAT(6,2) NOT NULL,
                PRIMARY KEY (RecipeID, IngredientID),
                FOREIGN KEY (RecioeID) REFERENCES tblRecipe(RecipeID),
                FOREIGN KEY (IngredientID) REFERENCES tblIngredient(IngredientID)
            )
        `);
        
        // Create tblRecipeEquipment
        // Same function as tblRecipeIngredient, but for linking tblEquipment
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblRecipeEquipment')
            CREATE TABLE tblRecipeEquipment (
                RecipeID NVARCHAR(50) NOT NULL,
                EquipmentID NVARCHAR(50) NOT NULL,
                Quantity FLOAT(6,2) NOT NULL,
                PRIMARY KEY (RecipeID, EquipmentID),
                FOREIGN KEY (RecioeID) REFERENCES tblRecipe(RecipeID),
                FOREIGN KEY (EquipmentID) REFERENCES tlbEquipment(EquipmentID)
            )
        `);
        

        // ADD HOWEVER MANY OTHER TABLES WE'RE GONNA NEED RIGHT HERE :)
        

    } catch (error) {
        console.log(error)
        throw error;
    }
}

// Hash password
async function hashPassword(password) {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(password, salt);
}

// Compare password
async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

// Find an exisiting user, similar to authenticate but has its dedicated function for readability
async function findUser(username) {
    try {
        console.log(username)
        const request = pool.request();
        const response = await request.input('Username', sql.NVarChar, username)
                     .query('SELECT * FROM tblUser WHERE Username = @Username');
        return response.recordset[0]; // will be null or something now :)
    } catch (error) {
        console.log(error)
        throw error;
    }
}

// Add a new user
async function addUser(newUser) {
    try {
        const hashedPassword = await hashPassword(newUser.Password);
        const request = pool.request();
        await request.input('EmployeeID', sql.NVarChar, newUser.Emp_ID)
                     .input('FirstName', sql.NVarChar, newUser.FirstName)
                     .input('LastName', sql.NVarChar, newUser.LastName)
                     .input('Username', sql.NVarChar, newUser.Username)
                     .input('Password', sql.NVarChar, hashedPassword)
                     .input('UserType', sql.Bit, newUser.UserType)
                     .query('INSERT INTO tblUser (EmployeeID, FirstName, LastName, Username, Password, UserType) VALUES (@EmployeeID, @FirstName, @LastName, @Username, @Password, @UserType)');
    } catch (error) {
        console.log(error)
        throw error;
    }
}

// Authenticate user
async function authenticateUser(username, password) {
    try {
        const request = pool.request();
        const result = await request.input('Username', sql.NVarChar, username)
                                   .query('SELECT * FROM tblUser WHERE Username = @Username');
        if (result.recordset.length === 0) {
            return null;
        }
        const user = result.recordset[0];
        const isValid = await comparePassword(password, user.Password);
        if (!isValid) {
            return null;
        }

        // Create a User object with the retrieved data
        return new User(user.EmployeeID, user.FirstName, user.LastName, user.Username, user.Password, user.UserType);
    } catch (error) {
        throw error;
    }
}

// Add a new session
async function addSession(SessionID, EmployeeID) {
    try {
        const request = pool.request();
        await request.input('SessionID', sql.NVarChar, SessionID)
                     .input('EmployeeID', sql.NVarChar, EmployeeID)
                     .query('INSERT INTO tblSession (SessionID, EmployeeID) VALUES (@SessionID, @EmployeeID)');
    } catch (error) {
        throw error;
    }
}

// Remove a session
async function removeSession(SessionID) {
    try {
        const request = pool.request();
        await request.input('SessionID', sql.NVarChar, SessionID)
                     .query('DELETE FROM tblSession WHERE SessionID = @SessionID');
    } catch (error) {
        throw error;
    }
}

// Get user by session (used to automatically sign someone in based on SessionStorage for the web frontend, not sure about mobile just yet)
async function getUserBySession(SessionID) {
    try {
        const request = pool.request();
        const result = await request.input('SessionID', sql.NVarChar, SessionID)
                                   .query('SELECT U.FirstName, U.LastName, U.Email FROM tblSession S JOIN tblUser U ON S.Email = U.Email WHERE S.SessionID = @SessionID');
        if (result.recordset.length === 0) {
            return null;
        }
        const user = result.recordset[0];
        return new User(user.EmployeeID, user.FirstName, user.LastName, user.Username, user.Password, user.UserType);
    } catch (error) {
        throw error;
    }
}

// Checks to make sure User had UserType of 1 (aka is a manager)
async function authenticateManager(username, password) {
    try {
        const request = pool.request();
        const result = await request.input('Username', sql.NVarChar, username)
                                   .query('SELECT * FROM tblUser WHERE Username = @Username AND UserType = 1');
        if (result.recordset.length === 0) {
            return null; // user is not a manager
        }
        const user = result.recordset[0];
        const isValid = await comparePassword(password, user.Password);
        if (!isValid) {
            return null;
        }

        // Create a User object with the retrieved data
        return new User(user.EmployeeID, user.FirstName, user.LastName, user.Username, user.Password, user.UserType);
    } catch (error) {
        throw error;
    }
}

// Registration route with frontend input validation
app.post('/api/users', async (req, res) => {
    try {
        const { firstname, lastname, username, password, usertype } = req.body;
        // generate a new GUID
        const emp_id = uuid.v4();
        // Create a new User instance
        const newUser = new User(emp_id, firstname, lastname, username, password, usertype);
        // Save the new user to the database
        await addUser(newUser);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        if (error.number === 2627) { // SQL Server unique constraint error
            res.status(400).json({ error: 'Account with that username already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Availability route (findUser)
app.get('/api/users', async (req, res) => {
    try {
        const { username } = req.query;
        const user = await findUser(username);
        if(!user) {
            res.status(200).json({ message: 'Username is available!' });
            return;
        }
        res.status(400).json({ error: 'Account with that username already exists' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
})

// Login route for employee with frontend input validation
app.post('/api/sessions/employee', async (req, res) => {
    try {
        const { username, password } = req.body;
        // Authenticate the user
        const user = await authenticateUser(username, password);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Create a session entry in tblSession
        const newSession = uuid.v4();
        await addSession(newSession, user.Emp_ID);
        res.status(200).json({ message: 'Logged in successfully', session: newSession });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login route for manager with frontend input validation
app.post('/api/sessions/manager', async (req, res) => {
    try {
        const { username, password, managerID } = req.body;
        if(managerID != 123456) { // CHANGE THIS TO BE MORE SECURE IN A LATER SPRINT
            return res.status(401).json({error: 'Invalid Manager ID'});
        }
        // Authenticate the user
        const user = await authenticateManager(username, password);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials for manager access' });
        }
        // Create a session entry in tblSession
        const newSession = uuid.v4();
        await addSession(newSession, user.Emp_ID);
        res.status(200).json({ message: 'Logged in successfully', session: newSession });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout route
app.delete('/api/sessions', async (req, res) => {
    try {
        const { sessionID } = req.body;
        // Remove the session entry from tblSession
        await removeSession(sessionID);
        // Destroy the session
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Saved-session login thingy :)
app.get('/api/sessions', async (req, res) => {
    try {
        // Get the user based on the session ID
        const user = await getUserBySession(req.sessionID);
        if (!user) {
            return res.status(401).json({ error: 'Session expired, please log in again' });
        }
        res.status(200).json({ message: `Welcome ${user.FirstName} ${user.LastName}` });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Initialize the database tables and start the server
createTables()
    .then(() => {
        const port = process.env.PORT || 3030;
        app.listen(port, () => {
            console.log(`Listening on port ${port}...`);
        });
    })
    .catch(err => {
        process.exit(1);
    });