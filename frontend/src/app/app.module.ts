import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { FlightSearchComponent } from './components/flight-search/flight-search.component';
import { SeatSelectionComponent } from './components/seat-selection/seat-selection.component';
import { BookingFormComponent } from './components/booking-form/booking-form.component';
import { PaymentComponent } from './components/payment/payment.component';
import { BookingHistoryComponent } from './components/booking-history/booking-history.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AdminBookingsComponent } from './components/admin-bookings/admin-bookings.component';
import { LogoComponent } from './components/logo/logo.component';
import { ThemeSwitcherComponent } from './components/theme-switcher/theme-switcher.component';
import { BookingModifyComponent } from './components/booking-modify/booking-modify.component';
import { ChatPanelComponent } from './components/chat-panel/chat-panel.component';
import { SupportDashboardComponent } from './components/support-dashboard/support-dashboard.component';
import { AIAssistantWidgetComponent } from './components/ai-assistant-widget/ai-assistant-widget.component';
import { FlightTrackerComponent } from './components/flight-tracker/flight-tracker.component';
import { TravelPackagesComponent } from './components/travel-packages/travel-packages.component';
import { AdminAviationManagementComponent } from './components/admin-aviation-management/admin-aviation-management.component';
import { CorporateInfoComponent } from './components/corporate-info/corporate-info.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    LoginComponent,
    RegisterComponent,
    FlightSearchComponent,
    SeatSelectionComponent,
    BookingFormComponent,
    PaymentComponent,
    BookingHistoryComponent,
    ProfileComponent,
    AdminBookingsComponent,
    LogoComponent,
    ThemeSwitcherComponent,
    BookingModifyComponent,
    ChatPanelComponent,
    SupportDashboardComponent,
    AIAssistantWidgetComponent,
    FlightTrackerComponent,
    TravelPackagesComponent,
    AdminAviationManagementComponent,
    CorporateInfoComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

