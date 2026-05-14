import React, { useState } from 'react';
import axios from 'axios';
import { baseApiURL } from "../../baseUrl";

const OnlineCompiler = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setOutput('');

    try {
      const response = await axios.post(`${baseApiURL()}/compiler/execute`, {
        language,
        code
      });
      
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setOutput(response.data.output);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while executing the code');
    } finally {
      setIsLoading(false);
    }
  };

  const codeSamples = {
    c: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
    java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
    python: `print("Hello, World!")`
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    setCode(codeSamples[newLanguage]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Online Code Compiler
          </h1>
          <p className="text-gray-400 mt-2">Write, compile, and run code in C, Java, and Python</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <label htmlFor="language" className="mr-2 text-gray-300">Language:</label>
              <select 
                id="language" 
                value={language} 
                onChange={handleLanguageChange}
                className="bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="c">C</option>
              </select>
            </div>
            
            <button 
              onClick={() => setCode(codeSamples[language])}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
            >
              Reset Code
            </button>
          </div>
          
          <div className="mb-4">
            <div className="bg-gray-900 rounded-t-md p-2 flex items-center">
              <div className="flex space-x-1.5 mr-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-sm text-gray-400">main.{language === 'python' ? 'py' : language === 'java' ? 'java' : 'c'}</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`Write your ${language} code here...`}
              rows={18}
              className="w-full bg-gray-900 text-gray-100 p-4 font-mono text-sm rounded-b-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
            />
          </div>
          
          <button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
              isLoading 
                ? 'bg-gray-700 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running Code...
              </div>
            ) : 'Run Code'}
          </button>
        </div>
        
        {output && (
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-3 text-green-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Output
            </h3>
            <div className="bg-gray-900 rounded-md p-4">
              <pre className="whitespace-pre-wrap text-green-300 font-mono text-sm">{output}</pre>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-gray-800 rounded-lg shadow-xl p-6">
            <h3 className="text-lg font-semibold mb-3 text-red-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Error
            </h3>
            <div className="bg-gray-900 rounded-md p-4">
              <pre className="whitespace-pre-wrap text-red-300 font-mono text-sm">{error}</pre>
            </div>
          </div>
        )}
        
        {!output && !error && (
          <div className="bg-gray-800 rounded-lg shadow-xl p-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-300">How to Use</h3>
            <ul className="list-disc list-inside text-gray-400 space-y-2">
              <li>Select your programming language from the dropdown</li>
              <li>Write or paste your code in the editor</li>
              <li>Click the "Run Code" button to execute your program</li>
              <li>View the output or any errors in the results section</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnlineCompiler;