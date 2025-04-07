

---

### **SQL Learning Tool Study Protocol**

#### **Objective**
To evaluate whether the custom-built SQL Query Builder tool accelerates and improves SQL learning outcomes compared to traditional methods (documentation, lectures, static materials).

---

### **Target Audience**
- Lower-division UC Berkeley students in CS/DS courses (e.g., CS61A, Data 8).
- Upper-division students with interest in SQL (e.g., Data 100, CS186).
- Students with **little to moderate** prior SQL exposure.

---

### **Study Design**

#### 1. **Participant Grouping**
   - **Group A:** Learners with little/no prior SQL knowledge.
   - **Group B:** Learners with coding experience (e.g., from CS61A/Data 8).

Each group is then **randomly assigned** to:
   - **Treatment group (uses SQL Query Builder tool)**
   - **Control group (uses traditional documentation/tutorials)**

---

#### 2. **Preparation Phase (60 minutes)**
- All participants are given **an instructional video** to ensure baseline exposure.
- Tool group interacts with the Query Builder; Control group uses lecture notes or documentation.
- **Environment is controlled** (no external resources or peer discussion).

---

#### 3. **Assessment Phase**
   - Time-limited exam simulating **a simplified Data 100/CS186 SQL-style question**.
   - Example format:
     ```sql
     SELECT ___ 
     FROM ___ 
     WHERE ___ AND ___ AND ___;
     ```
   - Schema provided:
     ```sql
     CREATE TABLE People (
       id INT PRIMARY KEY,
       name VARCHAR(100),
       age INT,
       job_occupation VARCHAR(100)
     );
     ```
   - Sample Task:
     “Design a query that returns all people named 'John', over the age of 25, with the occupation 'engineer'.”

---

#### 4. **Evaluation and Feedback**
   - **Pre-Test:** Simple query task (assesses baseline understanding).
     - Keep schema constant but change question to prevent memorization.
     - **No clarifying questions allowed** to simulate real testing conditions.
   - **Post-Test:** Harder queries (applies what was learned).
   - **Results are anonymized**; pre-test scores are not revealed to participants.
   - Participants receive **targeted feedback**, including:
     - Highlighted incorrect fields.
     - Blank fields are permitted without penalty.

---

### **Study Metrics**
- **Learning Time:** Measured from start of prep to exam time.
- **Accuracy:** % of correct clauses (SELECT, FROM, WHERE).
- **Engagement & Usability (optional):** Via post-study survey (Likert scale).

---

### **Technical Implementation Notes**
- Perform **dry run** to test clarity of instructions, UI stability, and question wording.
- TAs may act as **hidden variables** (optional—ensure consistency if used).
- Questions are structured to be incrementally harder.
- Avoid reuse of test questions for validity.

---