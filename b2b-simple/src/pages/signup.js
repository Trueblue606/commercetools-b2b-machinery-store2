import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
    customerType: 'catalogue', // 'catalogue' or 'contract'
    certificateFile: null,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleFileChange = (e) => {
    setFormData({ ...formData, certificateFile: e.target.files[0] });
  };

  

  const validateStep1 = () => ['catalogue', 'contract'].includes(formData.customerType);

  const validateStep2 = () => (
    formData.companyName.trim() &&
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.email.trim() &&
    formData.password.trim() &&
    (formData.customerType !== 'catalogue' || formData.certificateFile)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (step === 1 && !validateStep1()) {
      setError('Please select a valid account type');
      return;
    }
    if (step === 2 && !validateStep2()) {
      setError('Please fill all required fields and upload certificate if required');
      return;
    }

    setIsLoading(true);

    try {
      const authRes = await fetch('/api/auth');
      if (!authRes.ok) throw new Error('Failed to get auth token');
      const { token } = await authRes.json();

      let certificateFileUrl = null;
      if (formData.customerType === 'catalogue' && formData.certificateFile) {
        const fileData = new FormData();
        fileData.append('file', formData.certificateFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fileData,
        });

        if (!uploadRes.ok) {
          const errJson = await uploadRes.json().catch(() => null);
          throw new Error(errJson?.error || 'Failed to upload certificate');
        }

        const uploadJson = await uploadRes.json();
        certificateFileUrl = uploadJson.url;
      }

      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          companyName: formData.companyName,
          requestedGroup: formData.customerType,
          certificateFileUrl,
          token,
        }),
      });

      if (response.ok) {
        setSuccess('Account created! Your account is pending approval by an administrator.');
        setStep(1);
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          companyName: '',
          customerType: 'catalogue',
          certificateFile: null,
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Error creating account. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Error creating account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <form onSubmit={handleSubmit} style={{ maxWidth: '480px', width: '100%', padding: '40px', borderRadius: '20px', border: '2px solid #d7e9f7', boxShadow: '0 20px 60px rgba(13, 35, 64, 0.1)', backgroundColor: '#fff' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '32px' }}>{step === 1 ? 'Choose your account type' : 'Complete your profile'}</h2>

        {success && <p style={{ color: 'green', fontWeight: 600, marginBottom: '20px', textAlign: 'center' }}>{success}</p>}
        {error && <p style={{ color: 'red', fontWeight: 600, marginBottom: '20px', textAlign: 'center' }}>{error}</p>}

        {step === 1 && (
          <>
            {['catalogue', 'contract'].map((type) => (
              <label key={type} style={{ display: 'block', marginBottom: '16px', cursor: 'pointer', padding: '18px 24px', border: formData.customerType === type ? '2px solid #0d2340' : '2px solid #d7e9f7', borderRadius: '12px' }}>
                <input type="radio" name="customerType" value={type} checked={formData.customerType === type} onChange={(e) => setFormData({ ...formData, customerType: e.target.value })} style={{ display: 'none' }} />
                {type === 'catalogue' ? 'Catalogue Account (certificate required)' : 'Contract Account'}
              </label>
            ))}
            <button type="button" onClick={() => setStep(2)} style={{ width: '100%', padding: '16px', backgroundColor: '#0d2340', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700' }}>Continue</button>
          </>
        )}

        {step === 2 && (
          <>
            {['companyName', 'firstName', 'lastName', 'email', 'password'].map((name) => (
              <input key={name} type={name === 'password' ? 'password' : name === 'email' ? 'email' : 'text'} placeholder={name} value={formData[name]} onChange={(e) => setFormData({ ...formData, [name]: e.target.value })} style={{ width: '100%', marginBottom: '16px', padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafe', border: 'none' }} />
            ))}
            {formData.customerType === 'catalogue' && (
              <input type="file" onChange={handleFileChange} required style={{ marginBottom: '24px' }} />
            )}
            <button type="button" onClick={() => setStep(1)} style={{ marginRight: '12px', padding: '16px', border: '1px solid #ccc', borderRadius: '12px', backgroundColor: '#fff' }}>Back</button>
            <button type="submit" disabled={isLoading} style={{ padding: '16px', backgroundColor: '#0d2340', color: '#fff', border: 'none', borderRadius: '12px' }}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
