
# 📌 AI-Powered RFP Management System

A full-stack procurement workflow system that uses AI to automate creating, sending, parsing, and comparing RFPs (Request For Proposals).
## 🚀 Built With :

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| AI | Ollama (local LLM – llama3) |
| Database | MongoDB + Mongoose |
| Email | Nodemailer (Gmail SMTP) |

## 🌟 Features

| Step | Feature | Status |
|------|---------|-------|
| 1️⃣ | Create RFP from natural language | ✅ AI generates structured fields |
| 2️⃣ | Manage vendors and send RFP | ✅ Search, sort, select vendors + send real emails |
| 3️⃣ | Vendor response parsing | ✅ AI extracts price, warranty, delivery, payment terms |
| 4️⃣ | Proposal comparison | ✅ AI scoring + recommended vendor |


Additional:
- Clean UI with Tailwind
- Robust error+success banners
- Real SMTP workflow for RFP email distribution

## 🧠 AI Responsibilities

✔ Convert unstructured text → structured RFP fields  
✔ Parse vendor proposals from natural language  
✔ Score multiple proposals and recommend best option  
✔ Fully local AI (no paid API) using Ollama  
✔ Fallback validation to ensure no empty fields  
## 📦 Project Structure


```
rfp-ai-system/
├── backend/
│   ├── src/
│   │   ├── models/ (Rfp, Vendor, Proposal)
│   │   ├── routes/ (rfpRoutes, vendorRoutes, proposalRoutes)
│   │   ├── services/ (ollamaService, mailerService)
│   │   └── server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/pages/ (CreateRfpPage, VendorsPage, ResponsesPage, ComparisonPage)
    ├── src/api.js
    ├── .env.example
    └── package.json
```
## 🔧 Setup Instructions

### ✔ Prerequisites

Install before running:

- Node.js 18+
- MongoDB (local instance)
- Ollama (local LLM engine)
- Gmail App Password (for SMTP)
- Git & npm

## 🛠 Installation

#### Step 1 :- 

```bash
git clone <your_repo_url>
cd rfp-ai-system
```
#### Step 2 :- 

```
1. Create .env in backend
2. Copy Files From .env.example and paste it into .env
```

#### Step 3 :- 

#### Backend Setup

```bash
cd backend
npm install
npm run dev
```

#### Step 4 :- 

#### Frontend Setup

```bash
cd backend
npm install
npm run dev
```
#### Step 5 :- 

#### Configure email Sending/Receiving

```
in backend folder's .env file 
paste your email id and app password

```
For App Password :-
Visit : https://myaccount.google.com/apppasswords

#### Step 6 :- 

#### Setup Ollama Localy

#### Step 1 ( Installation ) -
 **a) macOS**

1. Go to Ollama’s download page:
👉 Search “Ollama download” in your browser (official site is ollama.com).

2. Download the .dmg file.

3. Open it and drag Ollama into Applications.

4. Run Ollama (it will start the background service).

Or

4. Run via terminal (Homebrew):
``` bash
brew install ollama
```
5. After install, confirm:
```bash
ollama --version
```
**b) Windows**

1. Visit the Ollama website (search “Ollama Windows download”).

2. Download the .exe installer.

3. Run the installer → follow the setup wizard.
4. After install, confirm:
```bash
ollama --version
```


**c) Linux**

1. In your terminal:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

2. After install, confirm:
```bash
ollama --version
```

**Step 2 (Install & Setup Llama3 Model)**
1. Download Llama 3 model with Ollama
In terminal Run
```bash
ollama pull llama3
```

2. After pulling, Run

```bash
ollama run llama3
```


**Step 3. Use Llama 3 via API (for apps / coding)**

Ollama exposes a local HTTP API (default: http://localhost:11434).

- Ensure server is running
- Open Terminal in VS Code and Run Command
```bash
ollama serve
```
- Leave that terminal open.


## ⚙️ API Documentation

#### 📍 RFP Routes
#### ➤ Create a new RFP (AI Generated)

```bash
  POST /api/rfps
```

| Body Field | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `naturalLanguageDescription` | `string` | **Required**. User’s RFP description in plain English |

📌 Returns structured RFP parsed by Ollama.

#### ➤ Get all RFPs

```bash
  GET /api/rfps
```

#### ➤ Update structured fields for an RFP

```bash
PUT /api/rfps/:id
```

| URL Param | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `id`      | `string` | **Required**. RFP document ID |


| Body Field | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `title`      | `string` | Optional |
| `naturalLanguageDescription`      | `string` |  Optional |
| `structured`      | `string` | Budget, warranty, delivery time, items, etc. |


#### 📍 Vendor Routes
#### ➤ Add a Vendor

```bash
  POST /api/vendors
```
| Body Field | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `name`      | `string` |  **Required** |
| `email`      | `string` |   **Required** |
| `company`      | `string` | Optional |

#### ➤ Get all Vendors

```bash
  GET /api/vendors
```



#### 📍 Proposal Routes
#### ➤ Send RFP to selected vendors (Creates proposals + sends email)

```bash
  POST /api/proposals/send
```
| Body Field | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `rfpId`      | `string` |  **Required** |
| `vendorsId`      | `array` `of` `string` |   **Required**. Vendor IDs to send RFP to |


📌 Side effects:
- Creates proposals with status `sent`
- Sends real emails using Nodemailer

#### ➤ Get proposals for a specific RFP

```bash
GET /api/proposals?rfpId={id}
```
| Query Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `rfpId`      | `string` |  **Required**. Filter proposals by RFP |

#### ➤ Parse vendor reply + save structured proposal (AI extracts fields)
```bash
PATCH /api/proposals/:id/respond
```
| URL Param | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `id`      | `string` | **Required**. Proposal ID |

| Body Field | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `resposeText`      | `string` | **Required**. Vendor email content pasted by user |

📌 AI extracts:

- `price`
- `deliveryDays`
- `warrantyMonths`
- `paymentTerms`
- `notes`

Updates status → `"responded"`

#### ➤ AI Compare proposals & recommend vendor
```bash
GET /api/proposals/compare?rfpId={id}
```
| Query Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `rfpId`      | `string` |  **Required**.|


📌 AI Returns:

| Field | Description                       |
| :-------- | :-------------------------------- |
| `score`      |   0 – 10 score vs RFP requirements|
| `isRecommended`      |  true for best vendor |
| `reason`      |   Short justification |


## 🤖 AI Tools Usage Disclosure

AI (ChatGPT) was used as an assistant for:

- Understanding the workflow of the project
- Helping in UI designing
- Integrating the Ollama Llama3 model into the project
- Helping in Fallback Logic if Ollama Fails
- Debugging errors and minor logic fixes
- Helping in creating the README file


## 👨‍💻 Author
**Yashraj Singh**

📧 Email: info.yashrajsingh@gmail.com
