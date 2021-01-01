import { ChangeDetectorRef, Component, ComponentFactoryResolver, Input, OnInit, Renderer2, ViewChild, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { statCategory } from 'src/app/statsearch.service';
import { StatselectComponent } from '../../statselect/statselect.component';

@Component({
  selector: 'app-statfilters',
  templateUrl: './statfilters.component.html',
  styleUrls: ['./statfilters.component.scss']
})
export class StatfiltersComponent implements OnInit {

  @ViewChild('statContainerRef', {read: ViewContainerRef}) statContainerRef: ViewContainerRef;  //stat contianer template ref
  @Input() itemForm: FormGroup;                                                                 //Main item form

  public statFilters: FormGroup = new FormGroup({
  })

  constructor(private cd: ChangeDetectorRef, private compResolver: ComponentFactoryResolver, private renderer2: Renderer2) {
  }

  ngOnInit(): void { 
    this.itemForm.addControl('statFilters', this.statFilters);
  }

  ngAfterViewInit(): void {
    this.addStatSelect();
    this.cd.detectChanges();
  }

    /**
   * Adds a new Item Component
   * 
   * @param statData 
   *        Item: data to bind when creating the item
   */
  public addStatSelect(statData?: statCategory) {
    const newStatComp = this.compResolver.resolveComponentFactory(StatselectComponent);
    
    const componentRef = this.statContainerRef.createComponent(newStatComp);
    
    componentRef.instance.viewRef = componentRef.hostView;
    componentRef.instance.group = this.itemForm.controls.statFilters as FormGroup;
    componentRef.instance.newGroupCreated.subscribe(() => {
      this.addStatSelect();
    });

    this.renderer2.addClass(componentRef.location.nativeElement, 'stat-field');
  }
}