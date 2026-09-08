# NCSpectra (SIH 2026)

**NCSpectra** is a tactical mobile application and backend suite built for field officers to identify narcotics using colorimetry and computer vision. It modernizes field drug testing by replacing subjective visual checks with deterministic colorimetry, aiming for full compliance with Indian evidence laws (**NDPS Act** and **BSA 2023**).

---

## **Key Features**
* **Deterministic Colorimetry:** Replaces human visual estimation with CIELAB and Delta-E color distance calculations to match test strips against positive drug benchmarks.
* **Cryptographic Integrity:** Generates SHA-256 digital fingerprints for every captured photo and evidence record to ensure court admissibility under **Section 63 of the Bharatiya Sakshya Adhiniyam (BSA) 2023** and **Section 52A of the NDPS Act**.
* **Offline-First Security:** Utilizes `expo-sqlite` with SQLCipher (AES-256 encryption) to securely store test logs locally when operating in remote zones without internet connectivity.
* **Automated Cloud Synchronization:** Seamlessly syncs offline encrypted logs to a centralized FastAPI backend when network connectivity is re-established.

---

## **Tech Stack**

* **Frontend:** React Native, Expo, TypeScript, `expo-sqlite` (SQLCipher)
* **Backend:** Python FastAPI, SQLAlchemy, Pydantic, Uvicorn
* **Security & Cryptography:** SHA-256 Hashing, AES-256 SQLCipher Database Encryption

---

## **Repository Structure**

```text
ncspectra/
├── FastAPI/              # Python FastAPI backend server
│   ├── app/              # Core application logic (API routes, models, schemas)
│   ├── requirements.txt  # Python package dependencies
│   └── .env.example      # Environment variable template
└── React-Native/         # React Native mobile application
    ├── src/              # App source code (services, utilities, components)
    ├── App.tsx           # Application entry point
    └── app.json          # Expo configuration with SQLCipher plugin
```

---

## **Getting Started**

### **1. Backend Setup (FastAPI)**
Navigate to the `FastAPI` directory, configure your environment variables, install dependencies, and run the server:
```bash
cd FastAPI
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### **2. Frontend Setup (React Native)**
Navigate to the `React-Native` directory, install packages, and start the Expo development server:
```bash
cd React-Native
npm install
npx expo install expo-constants expo-sqlite
npx expo start
```
