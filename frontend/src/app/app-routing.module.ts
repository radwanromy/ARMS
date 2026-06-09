import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FlightSearchComponent } from './components/flight-search/flight-search.component';
import { SeatSelectionComponent } from './components/seat-selection/seat-selection.component';
import { BookingFormComponent } from './components/booking-form/booking-form.component';
import { PaymentComponent } from './components/payment/payment.component';
import { BookingHistoryComponent } from './components/booking-history/booking-history.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/search', pathMatch: 'full' },
  { path: 'search', component: FlightSearchComponent },
  { path: 'seat-selection', component: SeatSelectionComponent, canActivate: [AuthGuard] },
  { path: 'booking', component: BookingFormComponent, canActivate: [AuthGuard] },
  { path: 'payment/:bookingId', component: PaymentComponent, canActivate: [AuthGuard] },
  { path: 'my-bookings', component: BookingHistoryComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '**', redirectTo: '/search' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
