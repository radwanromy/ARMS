import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-corporate-info',
  templateUrl: './corporate-info.component.html',
  styleUrls: ['./corporate-info.component.css']
})
export class CorporateInfoComponent implements OnInit, OnDestroy {
  currentPage = 'our-company';
  private paramSub!: Subscription;

  // Sidebar Categories
  categories = [
    {
      title: 'About Volant',
      items: [
        { id: 'our-company', label: 'Our Company' },
        { id: 'news-press', label: 'News & Press' },
        { id: 'global-alliances', label: 'Global Alliances' },
        { id: 'careers', label: 'Careers at Volant' }
      ]
    },
    {
      title: 'Services',
      items: [
        { id: 'premium-business', label: 'Premium Business Class' },
        { id: 'first-class', label: 'Volant First Class' },
        { id: 'dining', label: 'In-Flight Dining' },
        { id: 'cargo', label: 'Cargo Services' }
      ]
    },
    {
      title: 'Support & Contact',
      items: [
        { id: 'customer-service', label: 'Customer Service' },
        { id: 'special-assistance', label: 'Special Assistance' },
        { id: 'baggage-info', label: 'Baggage Information' },
        { id: 'email-support', label: 'Email Support' },
        { id: 'call-support', label: 'Call Support' }
      ]
    }
  ];

  // Baggage Allowance Calculator
  baggageClass = 'ECONOMY';
  bagCount = 1;
  bagWeight = 23;
  bagResult = '';
  bagStatusClass = '';

  // Dining Menu state
  diningMealType = 'appetizers';

  // Support Forms data
  emailForm = {
    category: 'Booking Inquiry',
    name: '',
    email: '',
    ref: '',
    message: ''
  };
  emailSubmitted = false;

  customerForm = {
    subject: '',
    bookingRef: '',
    message: ''
  };
  customerSubmitted = false;

  careerForm = {
    position: 'Cabin Crew - Tokyo Base',
    name: '',
    email: '',
    experience: '0-2 Years',
    resumeName: 'A_S_M_Radwan_CV.pdf'
  };
  careerSubmitted = false;

  // CEO and HQ info
  ceoName = 'A S M RADWAN';
  hqLocation = 'Tokyo, Japan';
  contactPhone = '+817092026067';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.paramSub = this.route.params.subscribe(params => {
      this.currentPage = params['page'] || 'our-company';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    this.calculateBaggage();
  }

  ngOnDestroy(): void {
    if (this.paramSub) {
      this.paramSub.unsubscribe();
    }
  }

  selectPage(pageId: string): void {
    this.router.navigate(['/info', pageId]);
  }

  calculateBaggage(): void {
    if (this.bagCount < 0) this.bagCount = 0;
    if (this.bagWeight < 0) this.bagWeight = 0;

    if (this.bagCount === 0) {
      this.bagResult = 'No baggage registered. Standard cabin carry-on rules apply (1 free cabin bag + 1 personal item, max 10kg total).';
      this.bagStatusClass = 'status-info';
      return;
    }

    if (this.baggageClass === 'ECONOMY') {
      if (this.bagCount > 1) {
        this.bagResult = `Exceeds allowance. Economy class permits 1 checked bag for free. Additional bags are subject to a $75 fee per piece.`;
        this.bagStatusClass = 'status-warning';
      } else if (this.bagWeight > 23) {
        this.bagResult = `Overweight baggage. Maximum weight allowed for Economy class is 23kg. Heavy bag fee ($50) will apply up to 32kg. Bags above 32kg cannot be accepted.`;
        this.bagStatusClass = 'status-danger';
      } else {
        this.bagResult = 'Within Allowance. Your 1 checked bag (up to 23kg) is fully complimentary for Economy class passengers.';
        this.bagStatusClass = 'status-success';
      }
    } else {
      // BUSINESS / FIRST
      if (this.bagCount > 2) {
        this.bagResult = `Exceeds allowance. Premium Business/First permits 2 checked bags for free. Additional bags are subject to a $50 fee per piece.`;
        this.bagStatusClass = 'status-warning';
      } else if (this.bagWeight > 32) {
        this.bagResult = `Overweight baggage. Maximum weight per bag allowed is 32kg. Bags exceeding 32kg must be repackaged or sent via Volant Cargo services.`;
        this.bagStatusClass = 'status-danger';
      } else {
        this.bagResult = `Within Allowance. Your ${this.bagCount} checked bag(s) (up to 32kg each) are fully complimentary under Premium Suite guidelines.`;
        this.bagStatusClass = 'status-success';
      }
    }
  }

  submitEmailForm(): void {
    if (!this.emailForm.name || !this.emailForm.email || !this.emailForm.message) {
      alert('Please fill out all required fields.');
      return;
    }
    this.emailSubmitted = true;
    setTimeout(() => {
      this.emailSubmitted = false;
      this.emailForm = {
        category: 'Booking Inquiry',
        name: '',
        email: '',
        ref: '',
        message: ''
      };
    }, 3500);
  }

  submitCustomerForm(): void {
    if (!this.customerForm.subject || !this.customerForm.message) {
      alert('Please fill out all required fields.');
      return;
    }
    this.customerSubmitted = true;
    setTimeout(() => {
      this.customerSubmitted = false;
      this.customerForm = {
        subject: '',
        bookingRef: '',
        message: ''
      };
    }, 3500);
  }

  submitCareerForm(): void {
    if (!this.careerForm.name || !this.careerForm.email) {
      alert('Please fill out all required fields.');
      return;
    }
    this.careerSubmitted = true;
    setTimeout(() => {
      this.careerSubmitted = false;
      this.careerForm = {
        position: 'Cabin Crew - Tokyo Base',
        name: '',
        email: '',
        experience: '0-2 Years',
        resumeName: 'A_S_M_Radwan_CV.pdf'
      };
    }, 3500);
  }
}
