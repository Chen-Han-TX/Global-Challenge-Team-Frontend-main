import axios from "axios";
import type { RawTransaction, EnrichedTransaction, TransactionInput, TransactionOutput, ForecastOutput } from "../types/transaction";

/* 
const API_BASE_URL = "http://localhost:5000/api"; // Adjust based on the backend

// Set to true to use your local backend for document upload (localhost:8000). 
const USE_LOCAL_BACKEND_FOR_DOCUMENT = true;
const LOCAL_BACKEND_URL = "http://localhost:8000";
*/

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export const transactionService = {
  // Fetch raw transactions
  // async getRawTransactions(): Promise<RawTransaction[]> {
  //   try {
  //     const response = await axios.get(`${API_BASE_URL}/transactions/raw`);
  //     return response.data;
  //   } catch (error) {
  //     console.error("Error fetching raw transactions:", error);
  //     return [];
  //   }
  // },

  // // Fetch enriched transactions
  // async getEnrichedTransactions(): Promise<EnrichedTransaction[]> {
  //   try {
  //     const response = await axios.get(`${API_BASE_URL}/transactions/enriched`);
  //     return response.data;
  //   } catch (error) {
  //     console.error("Error fetching enriched transactions:", error);
  //     return [];
  //   }
  // },

  // // Upload transactions for processing
  // async uploadTransactions(file: File): Promise<any> {
  //   const formData = new FormData();
  //   formData.append("file", file);

  //   try {
  //     const response = await axios.post(
  //       `${API_BASE_URL}/transactions/upload`,
  //       formData,
  //       {
  //         headers: {
  //           "Content-Type": "multipart/form-data",
  //         },
  //       }
  //     );
  //     return response.data;
  //   } catch (error) {
  //     console.error("Error uploading transactions:", error);
  //     throw error;
  //   }
  // },

  // // Get transaction statistics
  // async getStatistics(): Promise<any> {
  //   try {
  //     const response = await axios.get(`${API_BASE_URL}/transactions/stats`);
  //     return response.data;
  //   } catch (error) {
  //     console.error("Error fetching statistics:", error);
  //     return null;
  //   }
  // },

  // Get Enriched Data
  async getEnrichedData(
    transactions: TransactionInput[]
  ): Promise<TransactionOutput> {
    try {
      const requestPath = 'https://transaction-enrichment-pipeline.onrender.com/enrich'
      const requestParams = { transactions }

      const response = await axios.post<TransactionOutput>(
        requestPath,
        {
          params: requestParams
        }
      )
      return response.data
    } catch (error) {
      console.error("Error getting enriched data:", error);
      return { "enriched_transactions": [] };
    }
  },

  // Get ML Forecast
  async getForecast(
    data: string,
    forecast_days: number
  ): Promise<ForecastOutput> {
    try {
      const requestPath = 'https://forecast-demo.onrender.com/train-and-forecast'
      const requestBody = { data, forecast_days }

      const response = await axios.post<ForecastOutput>(
        requestPath,
        requestBody
      )
      return response.data
    } catch (error) {
      console.error("Error getting enriched data:", error);
      return {
        "forecast": {
          "days": -1,
          "last_known_balance": -1,
          "last_known_date": "",
          "predictions": []
        }
      };
    }
  },

  /*
  async postDocument(
    file: File
  ): Promise<any> {
    try {
      if (USE_LOCAL_BACKEND_FOR_DOCUMENT) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await axios.post(
          `${LOCAL_BACKEND_URL}/document/upload-file-for-analysis`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        return response.data;
      }
        const requestPath = 'https://document-processing-api.onrender.com/api/v1/pipeline/orchestrator'
        const response = await axios.post(
          requestPath,
          file,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        )
        return response.data
      } catch (error) {
        console.error("Error uploading document:", error);
        return [];
      }
    }
        */

      async postDocument(file: File): Promise<any> {
        try {
          const formData = new FormData();
          formData.append("file", file);
          const response = await axios.post(
            `${BACKEND_URL}/document/upload-file-for-analysis`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
          return response.data;
        } catch (error) {
          console.error("Error uploading document:", error);
          return [];
        }
      }
};

