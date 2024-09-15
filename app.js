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
    - The `Session` class manages session information for each logged-in user. It's linked to a user by `userID`. Whenever a user logs in or out, a new session is created or removed.
*/

// User class to group our user data together.
class User {
    constructor(user_id, firstname, lastname, username, password, userType) {
        this.UserID = user_id; // Primary Key
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
        this.UserID = emp_id; // Foreign to tblUser
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
        this.userID = emp_id;
        this.Notes = notes;
        this.Cost = cost;
        this.AddDate = addDate;
        this.ExpDate = expDate;
        this.PONumber = PO_num;
        this.RecipeID = recipe_id;
    }
}

// this will need to be used with the getRecipeInfo endpoint to be able to return all necessary info
// to the frontend ABOUT the recipe (i.e., its ingredients, tools, etc)
class Recipe {
    constructor(recipe_id, name, notes, yield_amount, product_id, prep_time, bake_time) {
        this.RecipeID = recipe_id;
        this.Name = name;
        this.Notes = notes;
        this.YieldAmount = yield_amount;
        this.ProductID = product_id;
        this.PrepTime = prep_time;
        this.BakeTime = bake_time;
        // added these because the frontend will need them to generate full Recipe information cards
        this.Ingredients = []; // this will need to be a dynamic array because ingredient count is unknown. (This will hold each Ingredient reorder/min amt too)
        this.Tools = []; // same reason here
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

// Load environment variables from environment (local use only)
//dotenv.config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MS SQL Server connection configuration
const dbConfig = {
    user: process.env.AZURE_SQL_USERNAME,
    password: process.env.AZURE_SQL_PASSWORD,
    server: process.env.AZURE_SQL_SERVER, // e.g., 'localhost'
    database: process.env.AZURE_SQL_DATABASE,
    options: {
        encrypt: true, // for Azure
        trustServerCertificate: false // set to true for local development with self-signed certs
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
    secret: process.env.AZURE_SQL_SESSION_SECRET, // Use environment variable
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.AZURE_SQL_NODE_ENV === 'production', // Ensure secure in production
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// Function to create tables (run once during setup)
async function createTables() {
    try {
        await poolConnect; // Ensure the pool is connected
        const request = pool.request();

	    	//Create tblUser
                await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblUser')
	            CREATE TABLE tblUser (
	                userID NVARCHAR(50) PRIMARY KEY,
	                FirstName NVARCHAR(64) NOT NULL,
	                LastName NVARCHAR(64) NOT NULL,
	                Username NVARCHAR(30) NOT NULL,
	                Password NVARCHAR(250) NOT NULL,
	                userType BIT NOT NULL,
	                UNIQUE (Username)
	            )
	        `);
		
	        //Create tblAddressType
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblAddressType')
	            CREATE TABLE tblAddressType (
	                typeID NVARCHAR(50) PRIMARY KEY,
	                description NVARCHAR(50),
	                active BIT
	            )
	        `);
	
	        //Create tblEmailType
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblEmailType')
	            CREATE TABLE tblEmailType (
	                typeID NVARCHAR(50) PRIMARY KEY,
	                description NVARCHAR(50),
	                active BIT
	            )
	        `);
	
	        //Create tblPayType
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblPayType')
	            CREATE TABLE tblPayType (
	                typeID NVARCHAR(50) PRIMARY KEY,
	                description NVARCHAR(50)
	            )
	        `);
	
	        //Create tblPhoneNumberTypes
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblPhoneNumberTypes')
	            CREATE TABLE tblPhoneNumberTypes (
	                typeID NVARCHAR(50) PRIMARY KEY,
	                description NVARCHAR(50),
	                active BIT
	            )
	        `);
	
	        //Create tblRaceType
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblRaceType')
	            CREATE TABLE tblRaceType (
	                typeID NVARCHAR(50) PRIMARY KEY,
	                description NVARCHAR(50)
	            )
	        `);
	
	        //Create tblState
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblState')
	            CREATE TABLE tblState (
	                stateID NVARCHAR(50) PRIMARY KEY,
	                description NVARCHAR(50)
	            )
	        `);
	
	        //Create tblBiWeek
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblBiWeek')
	            CREATE TABLE tblBiWeek (
	                biWeekID NVARCHAR(50) PRIMARY KEY,
	                biWeekNum INT,
	                startDate DATE
	            )
	        `);
	
	        //Create tblWeek
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblWeek')
	            CREATE TABLE tblWeek (
	                weekID NVARCHAR(50) PRIMARY KEY,
	                biWeekID NVARCHAR(50),
	                weekNum INT,
	                startDate DATE,
	                FOREIGN KEY (biWeekID) REFERENCES tblBiWeek(biWeekID) ON DELETE CASCADE
	            )
	        `);
	
	        //Create tblTimeType
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblTimeType')
	            CREATE TABLE tblTimeType (
	                typeID NVARCHAR(50) PRIMARY KEY,
	                description NVARCHAR(50)
	            )
	        `);
	
	        //Create tblAge
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblAge')
	            CREATE TABLE tblAge (
	                ageID NVARCHAR(50) PRIMARY KEY,
	                age NVARCHAR(3) NOT NULL,
	                userID NVARCHAR(50),
	                UNIQUE (userID),
	                FOREIGN KEY (userID) REFERENCES tblUser(userID) ON DELETE CASCADE
	            )
	        `);
	
	        //Create tblDOB
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblDOB')
	            CREATE TABLE tblDOB (
	                dobID NVARCHAR(50) PRIMARY KEY,
	                birthDate DATE NOT NULL,
	                userID NVARCHAR(50),
	                UNIQUE (userID),
	                FOREIGN KEY (userID) REFERENCES tblUser(userID) ON DELETE CASCADE
	            )
	        `);
	
	
	        //Create tblEmail
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblEmail')
	            CREATE TABLE tblEmail (
	                emailID NVARCHAR(50) PRIMARY KEY,
	                emailAddress NVARCHAR(320),
	                userID NVARCHAR(50),
	                typeID NVARCHAR(50),
	                valid BIT,
	                userType BIT,
	                UNIQUE (emailAddress),
	                FOREIGN KEY (typeID) REFERENCES tblEmailType(typeID),
	                FOREIGN KEY (userID) REFERENCES tblUser(userID) ON DELETE CASCADE
	            )
	        `);
	
	
	        //Create tblEmployeeTime
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblEmployeeTime')
	            CREATE TABLE tblEmployeeTime (
	                empTypeID NVARCHAR(50) PRIMARY KEY,
	                typeID NVARCHAR(50),
	                userID NVARCHAR(50),
	                FOREIGN KEY (typeID) REFERENCES tblTimeType(typeID),
	                FOREIGN KEY (userID) REFERENCES tblUser(userID) ON DELETE CASCADE
	            )
	        `);
	
	        //Create tblGender
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblGender')
	            CREATE TABLE tblGender (
	                genderID NVARCHAR(50) PRIMARY KEY,
	                genderType BIT NOT NULL,
	                userID NVARCHAR(50),
	                UNIQUE (userID),
	                FOREIGN KEY (userID) REFERENCES tblUser(userID) ON DELETE CASCADE
	            )
	        `);
	
	
	        //Create tblHireDate
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblHireDate')
	            CREATE TABLE tblHireDate (
	                hireID NVARCHAR(50) PRIMARY KEY,
	                hireDate DATE NOT NULL,
	                userID NVARCHAR(50),
	                UNIQUE (userID),
	                FOREIGN KEY (userID) REFERENCES tblUser(userID) ON DELETE CASCADE
	            )
	        `);
	
	        //Create tblDay
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblDay')
	            CREATE TABLE tblDay (
	                dayID NVARCHAR(50) PRIMARY KEY,
	                weekID NVARCHAR(50),
	                dayNum INT,
	                date DATE,
	                FOREIGN KEY (weekID) REFERENCES tblWeek(weekID) ON DELETE CASCADE
	            )
	        `);
	
	
	        //Create tblHourly
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblHourly')
	            CREATE TABLE tblHourly (
	                typeID NVARCHAR(50),
	                hourRate DECIMAL(5,2),
	                FOREIGN KEY (typeID) REFERENCES tblPayType(typeID) ON DELETE CASCADE
	            )
	        `);
	
	        //Create tblHourlyHoliday
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblHourlyHoliday')
	            CREATE TABLE tblHourlyHoliday (
	                typeID NVARCHAR(50),
	                hourRateHoliday DECIMAL(5,2),
	                FOREIGN KEY (typeID) REFERENCES tblPayType(typeID) ON DELETE CASCADE
	            )
	        `);
	
	        //Create tblHourlyOvertime
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblHourlyOvertime')
	            CREATE TABLE tblHourlyOvertime (
	                typeID NVARCHAR(50),
	                hourRateOT DECIMAL(5,2),
	                FOREIGN KEY (typeID) REFERENCES tblPayType(typeID) ON DELETE CASCADE
	            )
	        `);
	
	        //Create tblHoursWorkedDay
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblHoursWorkedDay')
	            CREATE TABLE tblHoursWorkedDay (
	                hoursID NVARCHAR(50) PRIMARY KEY,
	                userID NVARCHAR(50),
	                dayID NVARCHAR(50),
	                normalHours DECIMAL(5,2),
	                overtimeHours DECIMAL(5,2),
	                holidayHours DECIMAL(5,2),
	                FOREIGN KEY (userID) REFERENCES tblUser(userID) ON DELETE CASCADE,
	                FOREIGN KEY (dayID) REFERENCES tblDay(dayID) ON DELETE CASCADE
	            )
	        `);
	
	        //Create tblPay
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblPay')
	            CREATE TABLE tblPay (
	                payID NVARCHAR(50) PRIMARY KEY,
	                userID NVARCHAR(50),
	                typeID NVARCHAR(50),
	                userType BIT,
	                UNIQUE (userID),
	                FOREIGN KEY (userID) REFERENCES tblUser(userID) ON DELETE CASCADE,
	                FOREIGN KEY (typeID) REFERENCES tblPayType(typeID) ON DELETE CASCADE
	            )
	        `);
	
	        //Create tblPhoneNumber
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblPhoneNumber')
	            CREATE TABLE tblPhoneNumber (
	                phoneNumberID NVARCHAR(50) PRIMARY KEY,
	                areaCode NVARCHAR(3),
	                Number NVARCHAR(7),
	                typeID NVARCHAR(50),
	                valid BIT,
	                userID NVARCHAR(50),
	                userType BIT,
	                FOREIGN KEY (typeID) REFERENCES tblPhoneNumberTypes(typeID) ON DELETE CASCADE,
	                FOREIGN KEY (userID) REFERENCES tblUser(userID) ON DELETE CASCADE
	            )
	        `);
	
	        //Create tblRace
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblRace')
	            CREATE TABLE tblRace (
	                raceID NVARCHAR(50) PRIMARY KEY,
	                typeID NVARCHAR(50),
	                userID NVARCHAR(50),
	                FOREIGN KEY (typeID) REFERENCES tblRaceType(typeID),
	                FOREIGN KEY (userID) REFERENCES tblUser(userID) ON DELETE CASCADE
	            )
	        `);
	
	        //Create tblSalary
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblSalary')
	            CREATE TABLE tblSalary (
	                typeID NVARCHAR(50),
	                salaryRate DECIMAL(10,2),
	                FOREIGN KEY (typeID) REFERENCES tblPayType(typeID) ON DELETE CASCADE
	            )
	        `);
	
	        //Creaet tblSession
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblSession')
	            CREATE TABLE tblSession (
	                sessionID NVARCHAR(50) PRIMARY KEY,
	                userID NVARCHAR(50),
	                userType BIT,
	                FOREIGN KEY (userID) REFERENCES tblUser(userID) ON DELETE CASCADE
	            )
	        `);
	        
	        //Create tblShift
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblShift')
	            CREATE TABLE tblShift (
	                shiftID NVARCHAR(50) PRIMARY KEY,
	                dayID NVARCHAR(50),
	                shiftDescription NVARCHAR(100) NOT NULL,
	                available BIT NOT NULL,
	                FOREIGN KEY (dayID) REFERENCES tblDay(dayID) ON DELETE CASCADE
	            )
	        `);
	
	            //Create tblSSN
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblSSN')
	            CREATE TABLE tblSSN (
	                ssnID NVARCHAR(50) PRIMARY KEY,
	                SSN NVARCHAR(9) NOT NULL,
	                userID NVARCHAR(50),
	                UNIQUE (SSN),
	                UNIQUE (userID),
	                FOREIGN KEY (userID) REFERENCES tblUser(userID) ON DELETE CASCADE
	            )
	        `);
	
	        //Create tblUserAddress
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblUserAddress')
	            CREATE TABLE tblUserAddress (
	                addressID NVARCHAR(50) PRIMARY KEY,
	                address NVARCHAR(320),
	                userID NVARCHAR(50),
	                typeID NVARCHAR(50),
	                stateID NVARCHAR(50),
	                valid BIT,
	                userType BIT,
	                FOREIGN KEY (typeID) REFERENCES tblAddressType(typeID),
	                FOREIGN KEY (stateID) REFERENCES tblState(stateID),
	                FOREIGN KEY (userID) REFERENCES tblUser(userID) ON DELETE CASCADE
	            )
	        `);
	
	        //Create tblBiWeekDayConversion
	        await request.query(`
	            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblBiWeekDayConversion')
	            CREATE TABLE tblBiWeekDayConversion (
	                dayID NVARCHAR(50) PRIMARY KEY,
	                biWeekNum INT,
	                weekNum INT,
	                dayNum INT
	            )
	        `);

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
				MaxAmount DECIMAL(6,2) NOT NULL,
				ReorderAmount DECIMAL(6,2) NOT NULL,
				MinAmount DECIMAL(6,2) NOT NULL,
				Allergen BIT NOT NULL,
				FOREIGN KEY (IngredientCategoryID) REFERENCES tblIngredientCategory(IngredientCategoryID) ON DELETE CASCADE
			)
		`);

		// Create tblInventory
		await request.query(`
			IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblInventory')
			CREATE TABLE tblInventory (
				EntityID NVARCHAR(50) PRIMARY KEY,
				IngredientID NVARCHAR(50) NOT NULL,
				Quantity DECIMAL(6,2) NOT NULL,
				userID NVARCHAR(50) NOT NULL,
				Notes NVARCHAR(50),
				Cost DECIMAL(6,2) NOT NULL,
				CreateDateTime DATETIME NOT NULL,
				ExpireDateTime DATETIME NOT NULL,
				PONumber NVARCHAR(50),
				FOREIGN KEY (IngredientID) REFERENCES tblIngredient(IngredientID) ON DELETE CASCADE,
				FOREIGN KEY (userID) REFERENCES tblUser(userID)
			)
		`);

		// Create tblProductCategory
		await request.query(`
			IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblProductCategory')
			CREATE TABLE tblProductCategory (
				ProductCategoryID NVARCHAR(50) PRIMARY KEY,
				Name NVARCHAR(50) NOT NULL,
				Description NVARCHAR(50) NOT NULL
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
				FOREIGN KEY (ProductCategoryID) REFERENCES tblProductCategory(ProductCategoryID) ON DELETE CASCADE
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
				Amount DECIMAL(6,2),
				FOREIGN KEY (ProductID) REFERENCES tblProduct(ProductID)
			)
		`);

		// Create tblRecipe
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
		await request.query(`
			IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblRecipeIngredient')
			CREATE TABLE tblRecipeIngredient (
				RecipeID NVARCHAR(50) NOT NULL,
				IngredientID NVARCHAR(50) NOT NULL,
				Quantity DECIMAL(6,2) NOT NULL,
				PRIMARY KEY (RecipeID, IngredientID),
				FOREIGN KEY (RecipeID) REFERENCES tblRecipe(RecipeID),
				FOREIGN KEY (IngredientID) REFERENCES tblIngredient(IngredientID)
			)
		`);

		// Create tblRecipeEquipment
		await request.query(`
			IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblRecipeEquipment')
			CREATE TABLE tblRecipeEquipment (
				RecipeID NVARCHAR(50) NOT NULL,
				EquipmentID NVARCHAR(50) NOT NULL,
				Quantity DECIMAL(6,2) NOT NULL,
				PRIMARY KEY (RecipeID, EquipmentID),
				FOREIGN KEY (RecipeID) REFERENCES tblRecipe(RecipeID),
				FOREIGN KEY (EquipmentID) REFERENCES tblEquipment(EquipmentID)
			)
		`);
		
		// Create tblRecipeInstruction
		await request.query(`
			IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblRecipeInstruction')
			CREATE TABLE tblRecipeInstruction (
				RecipeID NVARCHAR(50) NOT NULL,
				StepID INT NOT NULL,
				Instruction NVARCHAR(MAX),
				PRIMARY KEY (RecipeID, StepID),
				FOREIGN KEY (RecipeID) REFERENCES tblRecipe(RecipeID)
			)	
		`)

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
        await request.input('UserID', sql.NVarChar, newUser.UserID)
                     .input('FirstName', sql.NVarChar, newUser.FirstName)
                     .input('LastName', sql.NVarChar, newUser.LastName)
                     .input('Username', sql.NVarChar, newUser.Username)
                     .input('Password', sql.NVarChar, hashedPassword)
                     .input('UserType', sql.Bit, newUser.UserType)
                     .query('INSERT INTO tblUser (UserID, FirstName, LastName, Username, Password, UserType) VALUES (@UserID, @FirstName, @LastName, @Username, @Password, @UserType)');
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
        return new User(user.UserID, user.FirstName, user.LastName, user.Username, user.Password, user.UserType);
    } catch (error) {
        throw error;
    }
}

// Add a new session
async function addSession(SessionID, UserID) {
    try {
        const request = pool.request();
        await request.input('SessionID', sql.NVarChar, SessionID)
                     .input('UserID', sql.NVarChar, UserID)
                     .query('INSERT INTO tblSession (SessionID, UserID) VALUES (@SessionID, @UserID)');
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

async function removeRecipe(recipeID) {
    try {
        const request = pool.request();
        await request.input('RecipeID', sql.NVarChar, recipeID)
                        .query('DELETE FROM tblRecipe WHERE RecipeID = @RecipeID');
    } catch (error) {
        throw error;
    }
}

// Get user by session (used to automatically sign someone in based on SessionStorage for the web frontend, not sure about mobile just yet)
async function getUserBySession(sessionID) {
    try {
        const request = pool.request();
        const result = await request.input('SessionID', sql.NVarChar, sessionID)
                                   .query('SELECT * FROM tblSession S JOIN tblUser U ON S.UserID = U.UserID WHERE S.SessionID = @SessionID');
        if (result.recordset.length === 0) {
            return null;
        }
        const user = result.recordset[0];
        return new User(user.userID, user.FirstName, user.LastName, user.Username, user.Password, user.UserType);
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
        return new User(user.UserID, user.FirstName, user.LastName, user.Username, user.Password, user.UserType);
    } catch (error) {
        throw error;
    }
}

// this will most likely need to be a LOT more complicated to accomodate for the getRecipeInfo route
// that will need to be created later
async function getRecipeFromDb(recipeName) {
    try {
        //Connecting
        const request = pool.request();

        //Query to fetch
        const result = await request.input('Recipe', sql.NVarChar, recipeName)
                                    .query(`SELECT * FROM tblRecipe WHERE Name = @Recipe`);

        //Checks to make sure it exists
        if (result.recordset.length == 0) {
            return null; //Doesn't exist
        }
        
        //Returns the whole object
        const recipe = result.recordset[0];
        return new Recipe(recipe.RecipeID, recipe.Name, recipe.Notes, recipe.YieldAmount, recipe.ProductID, recipe.PrepTime, recipe.BakeTime);

    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}


//Get ingredient helper function
async function getIngredientFromDb(ingredientName) {
    try {
        //Connecting
        const request = pool.request();

        //Query to fetch
        const result = await request.input('Ingredient', sql.NVarChar, ingredientName)
                                    .query(`SELECT * FROM tblIngredient WHERE Name = @Ingredient`);

        //Checks to make sure it exists
        if (result.recordset.length == 0) {
            return null; //Doesn't exist
        }
        
        //Returns the whole object
        const ingredient = result.recordset[0];
        return new Ingredient(ingredient.IngredientID, ingredient.Description, ingredient.Category, ingredient.Measurement, ingredient.MaxAmount, ingredient.ReorderAmount, ingredient.MinAmount);

    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// probably going to need this one to be able to pull the names depending on the category its in.
async function getRecipeNames()
{
    try {
        //Connecting
        const request = pool.request();

        //Get All
        const result = await request.query(`SELECT Name FROM tblRecipe`);

        if (!result) {
            return null;
        }

        return result.recordset;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// Registration route with frontend input validation
app.post('/api/users', async (req, res) => {
    try {
        const { firstname, lastname, username, password, usertype } = req.body;
        // generate a new GUID
        const user_id = uuid.v4();
        // Create a new User instance
        const newUser = new User(user_id, firstname, lastname, username, password, usertype);
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
        await addSession(newSession, user.UserID);
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
        await addSession(newSession, user.UserID);
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
		const { sessionID } = req.query;
        // Get the user based on the session ID
        const user = await getUserBySession(sessionID);
        if (!user) {
            return res.status(401).json({ error: 'Session expired, please log in again' });
        }
        res.status(200).json({ message: `Welcome ${user.FirstName} ${user.LastName}`, isManager: `${user.UserType}` });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

//Recipe GET
app.get('/api/recipe', async (req, res) => {
    recipeName = req.params.name;
    if(recipeName){
        try {
            const recipe = await getRecipeFromDb(recipeName);

            if (recipe) {
                res.status(200).json(recipe);   //Sends as a JSON response
            } else {
                res.status(404).send('Recipe not found');
            }
        } catch (error) {
            res.status(500).send('Error fetching recipe');
        }
    } else {
        res.status(500).json({ error: 'Internal serval error' });
    }
});

//RecipeNames GET
app.get('/recipe', async (req, res) => {
    try {
        const recipeNames = await getRecipeNames();

        if(recipeNames) {
            if (recipeNames.length > 0) {
                res.status(200).json(recipeNames);
            } else {
                res.status(404).send('No recipes found');
            }
        }
    } catch (error) {
        res.status(500).send('Error retrieving recipes');
    }
});

//Recipe DELETE
app.delete('/api/recipe', async (req, res) => {
    try {
        const { recipeID } = req.body;

        //Removes
        await removeRecipe(recipeID);

        //Destroys
        res.status(200).json({ message: 'Recipe Successfully Deleted'});
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
})                       

//ingredient GET
app.get('/api/ingredient', async (req, res) => {
    const ingredientName = req.query.name;
    if(ingredientName){
        try {
            const ingredient = await getIngredientFromDb(ingredientName);

            if (ingredient) {
                res.status(200).json(ingredient);   //Sends as a JSON response
            } else {
                res.status(404).send('Ingredient not found');
            }
        } catch (error) {
            res.status(500).send('Error fetching ingredient');
        }
    } else {
        res.status(500).json({ error: 'Internal serval error' });
    }
});

// Recipe Get info 
app.get('/api/recipeInfo', async (req, res) => {
    const { recipeName } = req.query.name;
    const { recipeID } = req.query.id;

    if (recipeName || recipeID) {
        try {
            const request = pool.request();

            let query = '';
            if (recipeName) {
                request.input('RecipeName', sql.NVarChar, recipeName);
                query = 'SELECT * FROM vwRecipeInfo WHERE RecipeName = @RecipeName';
            } else if (recipeID) {
                request.input('RecipeID', sql.NVarChar, recipeID);
                query = 'SELECT * FROM vwRecipeInfo WHERE RecipeID = @RecipeID';
            }

            const result = await request.query(query);
            const recipeInfo = result.recordset[0]; // Retrieve the first record

            if (recipeInfo) {
                res.status(200).json(recipeInfo);
            } else {
                res.status(404).send('Recipe not found');
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Error fetching recipe information');
        }
    } else {
        res.status(400).json({ error: 'Recipe name or ID is required' });
    }
});

// Function to add a product category
async function addProductCategory(newProductCategory) {
    try {
        await poolConnect; // Ensure the pool is connected
        const request = pool.request();

        // Insert query
        const query = `
            INSERT INTO tblProductCategory (ProductCategoryID, Name, Description)
            VALUES (@ProductCategoryID, @Name, @Description)
        `;

        // Input parameters
        request.input('ProductCategoryID', sql.NVarChar, newProductCategory.ProductCategoryID);
        request.input('Name', sql.NVarChar, newProductCategory.Name);
        request.input('Description', sql.NVarChar, newProductCategory.Description);

        // Execute the query
        await request.query(query);

        console.log('Product category added successfully');
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// POST endpoint to add a product category
app.post('/api/productCategory', async (req, res) => {
    const { Name, Description } = req.body;

    if (!Name || !Description) {
        return res.status(400).send('Missing required fields');
    }

    const ProductCategoryID = uuid.v4(); // Generate a UUID for ProductCategoryID

    try {
        await addProductCategory({ ProductCategoryID, Name, Description });
        res.status(201).send('Product category added successfully');
    } catch (error) {
        res.status(500).send('Internal server error');
    }
});


// Function to add a product
async function addProduct(newProduct) {
    try {
        await poolConnect; // Ensure the pool is connected
        const request = pool.request();

        // Insert query
        const query = `
            INSERT INTO tblProduct (ProductID, Name, Description, ProductCategoryID)
            VALUES (@ProductID, @Name, @Description, @ProductCategoryID)
        `;

        // Input parameters
        request.input('ProductID', sql.NVarChar, newProduct.ProductID);
        request.input('Name', sql.NVarChar, newProduct.Name);
        request.input('Description', sql.NVarChar, newProduct.Description);
        request.input('ProductCategoryID', sql.NVarChar, newProduct.ProductCategoryID);

        // Execute the query
        await request.query(query);

        console.log('Product added successfully');
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// POST endpoint to add a product
app.post('/api/product', async (req, res) => {
    const { Name, Description, ProductCategoryID } = req.body;

    if (!Name || !Description || !ProductCategoryID) {
        return res.status(400).send('Missing required fields');
    }

    const ProductID = uuid.v4(); // Generate a UUID for ProductID

    try {
        await addProduct({ ProductID, Name, Description, ProductCategoryID });
        res.status(201).send('Product added successfully');
    } catch (error) {
        res.status(500).send('Internal server error');
    }
});

// POST endpoint to add a recipe
app.post('/api/recipe', async (req, res) => {
    const { Name, Notes, YieldAmount, ProductID, PrepTime, BakeTime } = req.body;

    if (!Name || !YieldAmount || !ProductID || !PrepTime || !BakeTime) {
        return res.status(400).send('Missing required fields');
    }

    try {
        // Parse and validate time to ensure it's in the correct format HH:mm:ss
        const formatTime = (time) => {
            const matches = time.match(/^(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,7})?$/);
            if (!matches) return null;
            return `${matches[1]}:${matches[2]}:${matches[3]}`;  // Strip off unnecessary fractions
        };

        const formattedPrepTime = formatTime(PrepTime);
        const formattedBakeTime = formatTime(BakeTime);

        if (!formattedPrepTime || !formattedBakeTime) {
            return res.status(400).send('Invalid time format. Use HH:mm:ss');
        }

        const RecipeID = uuid.v4(); // Generate a UUID for RecipeID

        await poolConnect; // Ensure the pool is connected
        const request = pool.request();
        const query = `
            INSERT INTO tblRecipe (RecipeID, Name, Notes, YieldAmount, ProductID, PrepTime, BakeTime)
            VALUES (@RecipeID, @Name, @Notes, @YieldAmount, @ProductID, CAST(@PrepTime AS TIME), CAST(@BakeTime AS TIME))
        `;

        // Input parameters
        request.input('RecipeID', sql.NVarChar, RecipeID);
        request.input('Name', sql.NVarChar, Name);
        request.input('Notes', sql.NVarChar, Notes);
        request.input('YieldAmount', sql.Int, YieldAmount);
        request.input('ProductID', sql.NVarChar, ProductID);
        request.input('PrepTime', sql.NVarChar, formattedPrepTime);  // Using NVarChar to pass time as string because sql.time seemed to not be compatible with mssql. It will be stored as TIME in the database
        request.input('BakeTime', sql.NVarChar, formattedBakeTime);

        await request.query(query);

        res.status(201).send('Recipe added successfully');
    } catch (err) {
        console.error('Error inserting recipe:', err);
        res.status(500).send('Internal server error');
    }
});

async function addIngredientCategory(newCategory) {
    try {
        await poolConnect; // Ensure the pool is connected
        const request = pool.request();

        // Insert query
        const query = `
            INSERT INTO tblIngredientCategory (IngredientCategoryID, Name, Description)
            VALUES (@IngredientCategoryID, @Name, @Description)
        `;

        // Input parameters
        request.input('IngredientCategoryID', sql.NVarChar, newCategory.IngredientCategoryID);
        request.input('Name', sql.NVarChar, newCategory.Name);
        request.input('Description', sql.NVarChar, newCategory.Description);

        // Execute the query
        await request.query(query);

        console.log('Ingredient category added successfully');
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

app.post('/api/ingredientCategory', async (req, res) => {
    const { Name, Description } = req.body;

    if (!Name || !Description) {
        return res.status(400).send('Missing required fields');
    }

    const IngredientCategoryID = uuid.v4(); // Generate a UUID for IngredientCategoryID

    try {
        await addIngredientCategory({ IngredientCategoryID, Name, Description });
        res.status(201).send('Ingredient category added successfully');
    } catch (error) {
        res.status(500).send('Internal server error');
    }
});

async function addIngredient(newIngredient) {
    try {
        await poolConnect;
        const request = pool.request();

        const query = `
            INSERT INTO tblIngredient (IngredientID, Name, Description, IngredientCategoryID, Measurement, MaxAmount, ReorderAmount, MinAmount, Allergen)
            VALUES (@IngredientID, @Name, @Description, @IngredientCategoryID, @Measurement, @MaxAmount, @ReorderAmount, @MinAmount, @Allergen)
        `;

        // Input parameters
        request.input('IngredientID', sql.NVarChar, newIngredient.IngredientID);
        request.input('Name', sql.NVarChar, newIngredient.Name);
        request.input('Description', sql.NVarChar, newIngredient.Description);
        request.input('IngredientCategoryID', sql.NVarChar, newIngredient.IngredientCategoryID);
        request.input('Measurement', sql.NVarChar, newIngredient.Measurement);
        request.input('MaxAmount', sql.Decimal(6, 2), newIngredient.MaxAmount);
        request.input('ReorderAmount', sql.Decimal(6, 2), newIngredient.ReorderAmount);
        request.input('MinAmount', sql.Decimal(6, 2), newIngredient.MinAmount);
        request.input('Allergen', sql.Bit, newIngredient.Allergen);

        // Execute the query
        await request.query(query);

        console.log('Ingredient added successfully');
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

app.post('/api/ingredient', async (req, res) => {
    const { Name, Description, IngredientCategoryID, Measurement, MaxAmount, ReorderAmount, MinAmount, Allergen } = req.body;
    if (!Name || !Description || !IngredientCategoryID || !Measurement || !MaxAmount || !ReorderAmount || !MinAmount || Allergen === undefined) {
        return res.status(400).send('Missing required fields');
    }

    const IngredientID = uuid.v4(); // Generate a UUID for IngredientID

    try {
        await addIngredient({ IngredientID, Name, Description, IngredientCategoryID, Measurement, MaxAmount, ReorderAmount, MinAmount, Allergen });
        res.status(201).send('Ingredient added successfully');
    }
    catch (error) {
        res.status(500).send('Internal server error');
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