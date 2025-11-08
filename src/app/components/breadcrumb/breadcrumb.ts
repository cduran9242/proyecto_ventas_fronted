import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';

interface BreadcrumbItem {
  label: string;
  url: string;
  isLast: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css'
})
export class BreadcrumbComponent {
  items: BreadcrumbItem[] = [];
  readonly baseItem: BreadcrumbItem = {
    label: 'Sistema de Ventas',
    url: '/principal',
    isLast: false
  };

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.buildTrail());

    this.buildTrail();
  }

  private buildTrail(): void {
    const crumbs: BreadcrumbItem[] = [this.baseItem];
    const routeData = this.getBreadcrumbData();

    routeData.forEach((label, index) => {
      const url = index === routeData.length - 1 ? this.router.url : this.baseItem.url;
      crumbs.push({
        label,
        url,
        isLast: index === routeData.length - 1
      });
    });

    this.items = crumbs;
  }

  private getBreadcrumbData(): string[] {
    const data: string[] = [];
    let currentRoute = this.activatedRoute.root;

    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
      const snapshot = currentRoute.snapshot;
      const crumbData = snapshot.data?.['breadcrumb'] as string[] | undefined;
      if (crumbData) {
        data.push(...crumbData);
      }
    }

    return data;
  }
}

