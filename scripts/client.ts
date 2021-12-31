import axios from "axios";

axios.post('http://localhost:3000/auth', {
    todo: 'Buy the milk'
  })
  .then(res => {
    console.log(`statusCode: ${res.status}`)
    console.log(`data: ${res.data}`);
  })
  .catch(error => {
    console.error(error)
})
