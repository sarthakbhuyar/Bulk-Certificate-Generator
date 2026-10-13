<div align="center">

# 🏅 CertiBatch — High-Throughput Bulk Certificate Generator \& Verification Hub

**Production-ready asynchronous certificate generation engine built with Python, FastAPI, and Relational Database.**  
*Includes fault-tolerant individual failure isolation, cryptographic tamper verification, interactive real-time visual UI, and a 100% passing Pytest test suite.*

[!\[Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-3776AB?style=for-the-badge\&logo=python\&logoColor=white)](https://www.python.org/)
[!\[FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge\&logo=fastapi\&logoColor=white)](https://fastapi.tiangolo.com/)
[!\[SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-D71F00?style=for-the-badge\&logo=sqlalchemy\&logoColor=white)](https://www.sqlalchemy.org/)
[!\[Pydantic](https://img.shields.io/badge/Pydantic-V2-E92063?style=for-the-badge\&logo=pydantic\&logoColor=white)](https://docs.pydantic.dev/)
[!\[Pytest](https://img.shields.io/badge/Tests-6%2F6%20Passed-2ea44f?style=for-the-badge\&logo=pytest\&logoColor=white)](https://pytest.org/)
[!\[License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

[✨ Features](#-key-features) • [🚀 Quick Start (Local Laptop)](#-how-to-run-on-your-local-system) • [🧪 Running Tests](#-running-automated-tests) • [📡 API Reference](#-rest-api-reference--curl-examples) • [🛡️ Architecture](#-system-architecture--design-decisions)

</div>

\---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Problem Statement Requirements Coverage](#-problem-statement-requirements-coverage)
4. [How to Run on Your Local System](#-how-to-run-on-your-local-system)

   * [Method 1: Standalone Python FastAPI (Fastest \& Simplest)](#method-1-python-fastapi-standalone-recommended)
   * [Method 2: Full React Web Application](#method-2-full-stack-react-web-application)
5. [Running Automated Tests (100% Pass)](#-running-automated-tests)
6. [REST API Reference \& cURL Examples](#-rest-api-reference--curl-examples)
7. [System Architecture \& Design Decisions](#-system-architecture--design-decisions)
8. [Interview Q\&A Guide](#-interview-qa-guide)
9. [Project File Structure](#-project-file-structure)

\---

## 🎯 Project Overview

An organization issuing diplomas, credentials, or training certificates often needs to generate hundreds or thousands of certificates simultaneously.

**CertiBatch** solves this problem by providing:

* **Asynchronous Batch Processing:** Requests return an immediate `202 Accepted` job receipt with a tracking URL, processing large batches in background queues without HTTP gateway timeouts.
* **Fault-Tolerant Individual Error Isolation:** If one recipient in a batch has an invalid email or corrupt name, that specific recipient is isolated with a clear failure reason, while all other valid certificates in the batch generate uninterrupted.
* **Predefined Master Vector Template:** Generates mathematically crisp, print-ready vector SVG certificates (standard 1200×850 landscape diploma) with guilloche borders, embossed gold seal of authenticity, custom signatures, and verification security marks.
* **Cryptographic Verification:** Every issued credential receives a deterministic SHA-256 tamper-proof hash and QR token, verifiable via a public endpoint.

\---

## ✨ Key Features

|Feature|Description|
|-|-|
|⚡ **Bulk Generation**|Submit batches of 1 to 10,000+ recipients in a single API call.|
|🛡️ **Fault-Tolerant Isolation**|Bad recipient data never crashes or stops the remaining certificates in the job.|
|📊 **Real-Time Progress Tracking**|Live polling of job status (`queued`, `processing`, `completed`, `partially\_completed`, `failed`) with processed count, success count, failure count, and percentage.|
|📜 **Predefined Master Vector Template**|4 elegant themes: *Royal Gold*, *Executive Navy*, *Academic Emerald*, and *Modern Indigo*.|
|📦 **Bulk ZIP Export**|Download all generated certificates in a batch bundled into a single `.zip` archive.|
|🔍 **Tamper-Evident Verification**|Public `/api/v1/certificates/verify/{token}` endpoint validates authentic credentials against the primary database.|
|📖 **Interactive Swagger UI**|Fully documented OpenAPI 3.0 specification available at `/docs`.|

\---

## 📊 Problem Statement Requirements Coverage

|#|Requirement|Implementation|Status|
|:-:|-|-|:-:|
|**1**|**Accept Certificate Generation Request**|`POST /api/v1/jobs` \& `POST /api/v1/certificates/generate` accept event metadata, signatory, and recipient lists.|✅ **Complete**|
|**2**|**Validate Recipient Data**|Pydantic V2 `@field\_validator` \& RFC email format checking with clear constraint errors.|✅ **Complete**|
|**3**|**Generate Predefined Certificate**|Vector SVG diploma template with guilloche textures, medallion seals, and security marks.|✅ **Complete**|
|**4**|**Track Generation Status**|Relational status lifecycle with processed/success/failure metrics and timestamps.|✅ **Complete**|
|**5**|**Allow Client to Check Progress**|`GET /api/v1/jobs/{job\_id}` returns real-time progress percentages and per-recipient outcomes.|✅ **Complete**|
|**6**|**Retrieve Generated Certificates**|Direct SVG vector stream, PNG rasterization, bulk ZIP export, and verification lookup.|✅ **Complete**|
|**7**|**Individual Failure Handling**|Try/catch per recipient in worker loop; records errors without stopping batch; resolves to `partially\_completed`.|✅ **Complete**|
|**8**|**Comprehensive Test Suite**|6 Pytest integration tests covering all critical paths with 100% pass guarantee.|✅ **Complete**|

\---

## 🚀 How to Run on Your Local System

You can run this project locally on your laptop using **Windows Command Prompt (`cmd.exe`)**, **PowerShell**, or **macOS/Linux Terminal**.

### Prerequisites Check

Open your terminal/command prompt and verify your installed tools:

```cmd
python --version
pip --version
```

> \*(Requires Python 3.10+. If running Option 2, also verify `node -v` and `npm -v`).\*

\---

### Method 1: Python FastAPI Standalone (Recommended)

*This runs the FastAPI backend and serves the **complete visual certificate generator studio** on port 8000.*

#### Step 1: Open Command Prompt in `backend\_python`

```cmd
cd path\\to\\Bulk Certificate Generator\\backend\_python
```

#### Step 2: Install Python Dependencies

```cmd
pip install -r requirements.txt
```

*(If you encounter permission issues on Windows, run `pip install --user -r requirements.txt`).*

#### Step 3: Start the FastAPI Server

```cmd
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

#### Step 4: Open in Your Browser

* 🎨 **Visual Certificate Generator Studio \& Side-by-Side Preview:**  
👉 **`http://127.0.0.1:8000/`** *(or `http://localhost:8000/`)*
* 📖 **Interactive Swagger UI API Documentation:**  
👉 **`http://127.0.0.1:8000/docs`**
* 📚 **Alternative ReDoc Documentation:**  
👉 **`http://127.0.0.1:8000/redoc`**

> ⚠️ \*\*Windows Note:\*\* Always use `http://127.0.0.1:8000` or `http://localhost:8000` in your browser. Do not type `0.0.0.0` as Windows web browsers block it as `ERR\_ADDRESS\_INVALID`.

\---

### Method 2: Full-Stack React Web Application

*If you also wish to run the React 19 frontend:*

1. Open a **new Command Prompt window**.
2. Navigate to the **root project directory** (where `package.json` is located):

```cmd
   cd path\\to\\Bulk-Certificate-Generator
   ```

3. Install Node.js packages:

```cmd
   npm install
   ```

4. Start the development server:

```cmd
   npm run dev
   ```

5. Open your browser:
👉 **`http://localhost:3000/`**

\---

## 🧪 Running Automated Tests

The automated test suite verifies all 6 core requirements from the problem statement:

```cmd
cd backend\_python
python -m pytest test\_certificate\_generator.py -v
```

### ✅ Expected Output:

```text
============================= test session starts =============================
platform win32 -- Python 3.12 -- pytest-8.3.4
collected 6 items

test\_certificate\_generator.py::test\_1\_create\_generation\_job PASSED            \[ 16%]
test\_certificate\_generator.py::test\_2\_input\_validation PASSED                 \[ 33%]
test\_certificate\_generator.py::test\_3\_certificate\_generation PASSED           \[ 50%]
test\_certificate\_generator.py::test\_4\_job\_status\_and\_progress PASSED          \[ 66%]
test\_certificate\_generator.py::test\_5\_handling\_individual\_certificate\_failure PASSED  \[ 83%]
test\_certificate\_generator.py::test\_6\_retrieving\_generated\_certificates\_and\_verification PASSED \[100%]

============================== 6 passed in 1.28s ==============================
```

\---

## 📡 REST API Reference \& cURL Examples

### 1\. Submit Bulk Certificate Generation Job

**`POST /api/v1/jobs`** *(or `POST /api/v1/certificates/generate`)*

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/jobs" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event\_name": "Full-Stack Software Architecture Bootcamp 2026",
    "organization\_name": "Acme Tech Academy",
    "issue\_date": "October 13, 2026",
    "signatory\_name": "Dr. Sarah Jenkins",
    "signatory\_title": "Dean of Engineering",
    "template\_theme": "royal\_gold",
    "recipients": \[
      {
        "name": "Alice Johnson",
        "email": "alice.johnson@example.com",
        "score": "98% (Honors)"
      },
      {
        "name": "Bob Smith",
        "email": "bob.smith@example.com",
        "score": "92%"
      },
      {
        "name": "Corrupted User",
        "email": "bad\_email\_no\_domain"
      }
    ],
    "async\_processing": true
  }'
```

**Response (`202 Accepted`):**

```json
{
  "id": "job\_a1b2c3d4e5",
  "status": "queued",
  "total\_recipients": 3,
  "processed\_count": 0,
  "success\_count": 0,
  "failure\_count": 0,
  "progress\_percentage": 0,
  "created\_at": "2026-10-13T12:00:00Z"
}
```

\---

### 2\. Check Job Status \& Progress

**`GET /api/v1/jobs/{job\_id}`**

```bash
curl -X GET "http://127.0.0.1:8000/api/v1/jobs/job\_a1b2c3d4e5"
```

**Response (`200 OK` — Showing Fault-Tolerance \& Individual Error Isolation):**

```json
{
  "id": "job\_a1b2c3d4e5",
  "status": "partially\_completed",
  "total\_recipients": 3,
  "processed\_count": 3,
  "success\_count": 2,
  "failure\_count": 1,
  "progress\_percentage": 100,
  "recipients": \[
    {
      "id": "rec\_job\_a1b2c3d4e5\_1",
      "name": "Alice Johnson",
      "email": "alice.johnson@example.com",
      "status": "success",
      "certificate\_id": "CERT-2026-A19F8B",
      "verification\_hash": "7E14C89D012B45A6"
    },
    {
      "id": "rec\_job\_a1b2c3d4e5\_2",
      "name": "Bob Smith",
      "email": "bob.smith@example.com",
      "status": "success",
      "certificate\_id": "CERT-2026-B823D1",
      "verification\_hash": "2F89C01EA45688D3"
    },
    {
      "id": "rec\_job\_a1b2c3d4e5\_3",
      "name": "Corrupted User",
      "email": "bad\_email\_no\_domain",
      "status": "failed",
      "error\_message": "Invalid recipient email format: 'bad\_email\_no\_domain'"
    }
  ]
}
```

\---

### 3\. Retrieve Individual Certificate Metadata \& SVG

**`GET /api/v1/certificates/{certificate\_id}`**

```bash
curl -X GET "http://127.0.0.1:8000/api/v1/certificates/CERT-2026-A19F8B"
```

\---

### 4\. Download Certificate SVG File Directly

**`GET /api/v1/certificates/{certificate\_id}/download`**

```bash
curl -O -J "http://127.0.0.1:8000/api/v1/certificates/CERT-2026-A19F8B/download"
```

\---

### 5\. Verify Authenticity via Public Token

**`GET /api/v1/certificates/verify/{token}`**

```bash
curl -X GET "http://127.0.0.1:8000/api/v1/certificates/verify/7E14C89D012B45A6"
```

**Response (`200 OK`):**

```json
{
  "verified": true,
  "message": "Valid and authentic certificate verified.",
  "certificate": {
    "certificate\_id": "CERT-2026-A19F8B",
    "verification\_hash": "7E14C89D012B45A6",
    "recipient\_name": "Alice Johnson",
    "event\_name": "Full-Stack Software Architecture Bootcamp 2026",
    "organization\_name": "Acme Tech Academy",
    "issue\_date": "October 13, 2026",
    "signatory\_name": "Dr. Sarah Jenkins",
    "score": "98% (Honors)"
  }
}
```

\---

## 🛡️ System Architecture \& Design Decisions

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        HTTP Client / Browser                           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       POST /api/v1/jobs            │ GET /api/v1/jobs/{id}
       (Bulk Batch Request)         │ (Poll Real-Time Progress)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     FastAPI Ingestion Layer                            │
│  - Pydantic V2 Structural Validation (Email RFC, Name Constraints)     │
│  - Persists Job \& Recipient Models with status = 'queued'              │
│  - Dispatches Asynchronous Task \& Returns HTTP 202 Accepted            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Background Worker Queue Loop                        │
│                                                                        │
│   for recipient in job.recipients:                                     │
│       try:                                                             │
│           validate(recipient)                                          │
│           generate\_cert\_id\_and\_sha256\_hash()                           │
│           render\_vector\_svg\_diploma()                                  │
│           save\_certificate() ──> \[status = 'success']                  │
│       except Exception as e:                                           │
│           record\_error\_reason(e) ──> \[status = 'failed']               │
│           # ZERO CASCADE FAILURE: loop continues immediately!          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Relational Database (SQLAlchemy)                     │
│  - jobs          (id, status, total, processed, success, failure)      │
│  - recipients    (id, job\_id, name, email, status, error\_message)      │
│  - certificates  (id, job\_id, verification\_hash \[INDEXED], svg\_data)  │
└────────────────────────────────────────────────────────────────────────┘
```

\---

## 💡 Interview Q\&A Guide

### Q1: Why did you choose Asynchronous background processing over Synchronous?

> \*\*Answer:\*\* In bulk processing, a single request may contain 500+ recipients. Processing them synchronously inside the HTTP request loop would easily exceed web server timeout limits (usually 30–60 seconds on standard reverse proxies like Nginx or AWS ALB) and block server threads. By returning `HTTP 202 Accepted` immediately with a `job\_id`, the client can poll the status URL (`/api/v1/jobs/{id}`) to track progress, making the system resilient to high workloads.

### Q2: How did you ensure a failure in one certificate does not crash the entire batch?

> \*\*Answer:\*\* We enforce \*\*Individual Failure Isolation\*\*. Inside the worker loop, each recipient is processed within an isolated `try/except` block. If validation fails (e.g. malformed email syntax or empty name) or rendering fails, the exception is caught, logged in `RecipientModel.error\_message`, the status is set to `failed`, and `job.failure\_count` increments. The loop \*\*never aborts\*\*, allowing all valid certificates to generate smoothly. The job completes with `status = "partially\_completed"`.

### Q3: Why use Vector SVG over PDF for the generation engine?

> \*\*Answer:\*\* 
> 1. \*\*Mathematical Precision \& Infinite Scalability:\*\* Vector SVG renders with sharp resolution at any screen size or DPI print scale without pixelation.
> 2. \*\*Performance \& Lightweight Storage:\*\* SVGs are plain XML text strings that can be stored in the database without multi-megabyte binary bloat.
> 3. \*\*No Heavy System Dependencies:\*\* Generating PDFs often requires heavy binary dependencies like Chromium, Puppeteer, or wkhtmltopdf. Vector SVG generates in pure Python in sub-millisecond execution times.

### Q4: How is certificate authenticity verified?

> \*\*Answer:\*\* Each certificate embeds a tamper-proof SHA-256 cryptographic hash derived from the certificate ID, recipient email, issuing authority, and issuance timestamp. This hash is indexed in the database. Anyone can query `/api/v1/certificates/verify/{hash}` to check authenticity without needing to log in.

\---

## 📁 Project File Structure

```text
.
├── backend\_python/                     # Standalone Python FastAPI Backend
│   ├── main.py                         # FastAPI routes, CORS, root HTML dashboard
│   ├── index.html                      # Embedded full visual generator studio \& preview
│   ├── models.py                       # SQLAlchemy ORM models (Job, Recipient, Certificate)
│   ├── schemas.py                      # Pydantic V2 validation \& response schemas
│   ├── services.py                     # Background worker loop, error isolation \& SVG engine
│   ├── database.py                     # SQLAlchemy engine, session maker \& DB dependency
│   ├── test\_certificate\_generator.py   # Pytest integration test suite (100% passing)
│   ├── requirements.txt                # Python dependencies
│   └── README.md                       # Backend-specific documentation
│
├── src/                                # Full-Stack React Application
│   ├── components/                     # Generator studio, job monitor, verify modal
│   ├── utils/                          # Vector SVG generator \& export utilities
│   ├── types/                          # TypeScript definitions
│   └── App.tsx                         # Main React application entry
│
├── server.ts                           # Node.js / Express development server
├── package.json                        # Frontend dependencies \& scripts
└── README.md                           # Master Project Documentation
```

\---

## 📄 License

This project is open-source and released under the **MIT License**.

