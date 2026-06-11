import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FlightSearchComponent } from './components/flight-search/flight-search.component';
import { SeatSelectionComponent } from './components/seat-selection/seat-selection.component';
import { BookingFormComponent } from './components/booking-form/booking-form.component';
import { PaymentComponent } from './components/payment/payment.component';
import { BookingHistoryComponent } from './components/booking-history/booking-history.component';
import { ProfileComponent } from './components/profile/profile.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AdminBookingsComponent } from './components/admin-bookings/admin-bookings.component';
import { AdminAviationManagementComponent } from './components/admin-aviation-management/admin-aviation-management.component';
import { BookingModifyComponent } from './components/booking-modify/booking-modify.component';
import { SupportDashboardComponent } from './components/support-dashboard/support-dashboard.component';
import { FlightTrackerComponent } from './components/flight-tracker/flight-tracker.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { SupportGuard } from './guards/support.guard';

const routes: Routes = [
  { path: '', redirectTo: '/search', pathMatch: 'full' },
  { path: 'search', component: FlightSearchComponent },
  { path: 'radar', component: FlightTrackerComponent },
  { path: 'seat-selection', component: SeatSelectionComponent, canActivate: [AuthGuard] },
  { path: 'booking', component: BookingFormComponent, canActivate: [AuthGuard] },
  { path: 'payment/:bookingId', component: PaymentComponent, canActivate: [AuthGuard] },
  { path: 'my-bookings', component: BookingHistoryComponent, canActivate: [AuthGuard] },
  { path: 'booking/modify/:bookingRef', component: BookingModifyComponent, canActivate: [AuthGuard] },
  { path: 'support/dashboard', component: SupportDashboardComponent, canActivate: [AuthGuard, SupportGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'admin/bookings', component: AdminBookingsComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'admin/aviation', component: AdminAviationManagementComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '**', redirectTo: '/search' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

