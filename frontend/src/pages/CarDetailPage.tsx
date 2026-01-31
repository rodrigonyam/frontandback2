import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Container, Typography, Box, Card, CardMedia, CardContent, Grid, Chip, Button, CircularProgress, Alert } from '@mui/material';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import GroupIcon from '@mui/icons-material/Group';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import { carsAPI } from '../services/api';
import { Car } from '../types';

const CarDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCar = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await carsAPI.getById(id);
        setCar(res.data.data?.car || null);
        setError(null);
      } catch (err) {
        console.error('Car detail error:', err);
        setError('Unable to load car details.');
      } finally {
        setLoading(false);
      }
    };

    loadCar();
  }, [id]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !car) {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="error">{error || 'Car not found.'}</Alert>
        <Button sx={{ mt: 2 }} component={RouterLink} to="/cars" variant="outlined">Back to cars</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Button component={RouterLink} to="/cars" variant="text" sx={{ mb: 2 }}>
        ← Back to cars
      </Button>

      <Card>
        <CardMedia
          component="img"
          height="240"
          image={car.image || 'https://via.placeholder.com/800x240?text=Car'}
          alt={`${car.make} ${car.model}`}
        />
        <CardContent>
          <Typography variant="h4" sx={{ mb: 1 }}>{car.make} {car.model}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{car.pickupLocation}</Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} md={4}>
              <SettingsSuggestIcon fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2" component="span">{car.transmission}</Typography>
            </Grid>
            <Grid item xs={6} md={4}>
              <LocalGasStationIcon fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2" component="span">{car.fuelType}</Typography>
            </Grid>
            <Grid item xs={6} md={4}>
              <GroupIcon fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2" component="span">{car.seats} seats</Typography>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip label={car.category} size="small" color="primary" variant="outlined" />
            {car.airConditioning && <Chip icon={<AcUnitIcon />} label="A/C" size="small" />}
          </Box>

          <Typography variant="h5" color="primary" sx={{ mb: 1 }}>
            {car.currency} {car.pricePerDay} / day
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Available: {car.available ? 'Yes' : 'No'}
          </Typography>

          <Button variant="contained" fullWidth>Rent this car</Button>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CarDetailPage;
