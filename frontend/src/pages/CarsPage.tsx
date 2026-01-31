import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Container, Typography, Box, Grid, Card, CardMedia, CardContent, CardActions, Button, Chip, CircularProgress, Alert } from '@mui/material';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import GroupIcon from '@mui/icons-material/Group';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import { carsAPI } from '../services/api';
import { Car, CarSearchParams } from '../types';

const CarsPage: React.FC = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true);
        // No required params: list all cars
        const response = await carsAPI.search({} as Partial<CarSearchParams>);
        setCars(response.data.data?.cars || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching cars:', err);
        setError('Failed to load cars.');
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

  if (loading) {
      return (
          <Container sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
          </Container>
      );
  }

  if (error) {
      return (
          <Container sx={{ py: 8 }}>
              <Alert severity="error">{error}</Alert>
          </Container>
      );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          Car Rental
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Rent the perfect vehicle for your journey
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {cars.map((car) => (
          <Grid item xs={12} md={6} lg={4} key={car.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="200"
                image={car.image || 'https://via.placeholder.com/300x200?text=No+Car+Image'}
                alt={`${car.make} ${car.model}`}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography gutterBottom variant="h5" component="h2">
                    {car.make} {car.model}
                    </Typography>
                    <Chip label={car.category} size="small" color="primary" variant="outlined" />
                </Box>
                
                <Grid container spacing={2} sx={{ mb: 2, color: 'text.secondary' }}>
                    <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
                        <SettingsSuggestIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{car.transmission}</Typography>
                    </Grid>
                    <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocalGasStationIcon fontSize="small" sx={{ mr: 1 }} />
                         <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{car.fuelType}</Typography>
                    </Grid>
                    <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
                        <GroupIcon fontSize="small" sx={{ mr: 1 }} />
                         <Typography variant="body2">{car.seats} Seats</Typography>
                    </Grid>
                    {car.airConditioning && (
                        <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
                            <AcUnitIcon fontSize="small" sx={{ mr: 1 }} />
                             <Typography variant="body2">A/C</Typography>
                        </Grid>
                    )}
                </Grid>

                <Typography variant="h6" color="primary">
                  {car.currency} {car.pricePerDay}
                  <Typography component="span" variant="body2" color="text.secondary"> / day</Typography>
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="large" fullWidth variant="outlined" component={RouterLink} to={`/cars/${car.id}`}>
                  View Details
                </Button>
                <Button size="large" fullWidth variant="contained">Rent Now</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        {cars.length === 0 && (
            <Grid item xs={12}>
                <Alert severity="info">No cars found for the default search criteria.</Alert>
            </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default CarsPage;