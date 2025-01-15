
import axios from 'axios';



const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_MYDOCUSOFT_DOCUSMS_UK_URL || 'https://docusoftpractice.com/PracticeServices.asmx'
})

export {  axiosInstance };
