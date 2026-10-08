async function test() {
  const res = await fetch('http://localhost:3000/api/patients?limit=1');
  const data = await res.json();
  const id = data.data[0].id;
  console.log('Testing update for patient:', id);
  
  const updateRes = await fetch(`http://localhost:3000/api/patients/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      custom_fields: {
        status: 'Waiting'
      }
    })
  });
  console.log('Update status:', updateRes.status);
  console.log(await updateRes.json());
}
test().catch(console.error);
