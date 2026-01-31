import React from 'react';
import { Container, Typography, Paper, Grid } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography variant="h3" sx={{ mb: 4 }}>
        Profile Settings
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Personal Information
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Name: {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Email: {user?.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Phone: {user?.phone || 'Not provided'}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Currency: {user?.preferences?.currency || 'USD'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Language: {user?.preferences?.language || 'English'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Notifications: {user?.preferences?.notifications ? 'Enabled' : 'Disabled'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage;