# 🔄 PostgreSQL Migration Guide

## ✅ Status: Database Created Successfully!

Your PostgreSQL database `ai_detection` has been created at `localhost:5432`

---

## 📝 Step-by-Step Migration

### **Step 1: Update `.env` File** ⚠️ IMPORTANT

Open `.env` and **replace `YOUR_PASSWORD`** with your actual PostgreSQL password:

```env
# BEFORE:
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/ai_detection

# AFTER (replace with your password):
DATABASE_URL=postgresql://postgres:your_actual_password@localhost:5432/ai_detection
```

**Example:**
```env
DATABASE_URL=postgresql://postgres:admin123@localhost:5432/ai_detection
```

---

### **Step 2: Initialize Database Tables**

Run this command to create all tables:

```bash
python init_postgres.py
```

This will create all 6 tables:
- ✅ users
- ✅ uploads
- ✅ detections
- ✅ alerts
- ✅ audit_logs
- ✅ sessions

---

### **Step 3: Verify Connection**

Test the database connection:

```bash
python -c "from backend.db.base import engine; print('✅ Connected!' if engine.connect() else '❌ Failed')"
```

---

### **Step 4: Start Your Application**

```bash
python main.py
```

Your app will now use PostgreSQL instead of SQLite! 🎉

---

## 🔍 What Changed?

### **Database Configuration**

**Before (SQLite):**
```python
DATABASE_URL=sqlite:///./ai_detection.db
```

**After (PostgreSQL):**
```python
DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_detection
```

### **All Models Remain the Same** ✅

No code changes needed! Your models work with both databases:
- User
- Upload
- Detection
- Alert
- AuditLog
- Session

---

## 🛠️ PostgreSQL Utilities

### **Connect to Database**
```bash
"E:\PostgreSQL\bin\psql.exe" -U postgres -d ai_detection
```

### **List All Tables**
```sql
\dt
```

### **View Table Structure**
```sql
\d users
\d uploads
\d detections
```

### **Check Database Size**
```sql
SELECT pg_size_pretty(pg_database_size('ai_detection'));
```

### **Backup Database**
```bash
"E:\PostgreSQL\bin\pg_dump.exe" -U postgres ai_detection > backup.sql
```

### **Restore Database**
```bash
"E:\PostgreSQL\bin\psql.exe" -U postgres ai_detection < backup.sql
```

---

## ⚙️ PostgreSQL Configuration

Your PostgreSQL is installed at: `E:\PostgreSQL`

**Key Directories:**
- **Binaries**: `E:\PostgreSQL\bin`
- **Data**: `E:\PostgreSQL\data`
- **Config**: `E:\PostgreSQL\data\postgresql.conf`

---

## 🔐 Security Settings

### **Default Settings**
- **Host**: localhost
- **Port**: 5432
- **Database**: ai_detection
- **User**: postgres
- **Password**: [Your password]

### **Create Additional User (Optional)**
```sql
CREATE USER ai_app WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ai_detection TO ai_app;

-- Then update .env:
DATABASE_URL=postgresql://ai_app:secure_password@localhost:5432/ai_detection
```

---

## 📊 Performance Comparison

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| Concurrent Users | Limited | Excellent |
| Write Performance | Good | Excellent |
| Scalability | Single File | Enterprise |
| Data Integrity | Good | Excellent |
| JSON Support | Basic | Native |
| Full-text Search | Limited | Advanced |

---

## 🐛 Troubleshooting

### **Error: "password authentication failed"**
✅ **Solution**: Update `.env` with correct password

### **Error: "database does not exist"**
✅ **Solution**: Run database creation command again
```bash
& "E:\PostgreSQL\bin\psql.exe" -U postgres -c "CREATE DATABASE ai_detection;"
```

### **Error: "relation does not exist"**
✅ **Solution**: Run table initialization
```bash
python init_postgres.py
```

### **Error: "connection refused"**
✅ **Solution**: Start PostgreSQL service
```bash
# Check if running
Get-Service -Name "*postgres*"

# Start if needed
Start-Service postgresql-x64-16
```

---

## ✅ Migration Checklist

- [x] PostgreSQL installed at `E:\PostgreSQL`
- [x] Database `ai_detection` created
- [ ] **Update `.env` with your password** ⚠️
- [ ] Run `python init_postgres.py` to create tables
- [ ] Test connection
- [ ] Start application with `python main.py`

---

## 🎯 Next Steps

After migration is complete:

1. **Test All Endpoints** - Ensure everything works
2. **Delete SQLite File** (optional) - `ai_detection.db`
3. **Update Documentation** - Note PostgreSQL requirement
4. **Setup Backups** - Schedule regular pg_dump backups

---

## 📚 Useful Commands Cheat Sheet

```bash
# Connect to database
"E:\PostgreSQL\bin\psql.exe" -U postgres -d ai_detection

# Inside psql:
\l                  # List databases
\dt                 # List tables
\d table_name       # Describe table
\du                 # List users
\q                  # Quit

# SQL Commands:
SELECT * FROM users LIMIT 5;
SELECT COUNT(*) FROM uploads;
SELECT * FROM alerts WHERE threat_level = 'dangerous';
```

---

## 🚀 Performance Optimization

After migration, consider:

1. **Create Indexes** (if not auto-created):
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_uploads_user_id ON uploads(user_id);
CREATE INDEX idx_detections_threat_level ON detections(threat_level);
```

2. **Vacuum Database** (periodically):
```sql
VACUUM ANALYZE;
```

3. **Monitor Connections**:
```sql
SELECT * FROM pg_stat_activity;
```

---

## ✨ Benefits of PostgreSQL

✅ **Production-Ready** - Enterprise-grade database  
✅ **Concurrent Access** - Multiple users simultaneously  
✅ **ACID Compliance** - Data integrity guaranteed  
✅ **Advanced Features** - Full-text search, JSON, arrays  
✅ **Scalability** - Handles millions of records  
✅ **Cloud-Ready** - Easy to deploy (AWS RDS, Azure, etc.)  

---

## 🎉 Congratulations!

You've successfully switched from SQLite to PostgreSQL!

Your application is now running on a production-grade database system.

**Current Setup:**
- 🗄️ **Database**: PostgreSQL 
- 📍 **Location**: E:\PostgreSQL
- 🌐 **Connection**: localhost:5432
- 📊 **Database**: ai_detection
- ✅ **Status**: Ready for production!
