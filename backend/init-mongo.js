// MongoDB initialization script for Docker setup
db = db.getSiblingDB('lucid-growth');

// Create a user for the application
db.createUser({
  user: 'app_user',
  pwd: 'app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'lucid-growth'
    }
  ]
});

// Create collections with proper indexes
db.createCollection('emails');

// Create indexes for better performance
db.emails.createIndex({ emailId: 1 }, { unique: true });
db.emails.createIndex({ timestamp: -1 });
db.emails.createIndex({ status: 1 });
db.emails.createIndex({ espType: 1 });

print('MongoDB initialization completed successfully');
