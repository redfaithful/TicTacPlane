import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

import {Point2, Point3} from '../cube.model';
import {sortedIndexesArray} from '../cube.utils';
import {PolarAngels} from '../game.utils';

@Component({
  selector: '[visual-cube]',
  standalone: false,
  templateUrl: './visual.cube.component.html',
  styleUrls: ['./visual.cube.component.css'],
})
export class VisualCubeComponent implements OnInit, OnChanges {
  vertices: Point3[] = [];
  faces: Point3[][] = [];

  readonly spacing = 0;

  origin = new Point3(0, 0, 0);
  center = new Point3(0, 0, 0);

  zIndex = 0;
  mathLength = 0;

  @Input() xLocation = 0;
  @Input() yLocation = 0;
  @Input() size = 0;

  @Input() centerX = 0;
  @Input() centerY = 0;
  @Input() centerZ = 0;

  @Input() offsetX = 0;
  @Input() offsetY = 0;
  @Input() offsetZ = 0;

  @Input() colour = 'lightgray';
  @Input() mouseTracking?: PolarAngels;
  @Input() length = 0;

  @Input() disabled = false;

  @Output() readonly selectionEvent = new EventEmitter<Point3>();

  ngOnInit(): void {
    this.initializeGeometry();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const mouseTrackingChange = changes['mouseTracking'];

    if (
      !mouseTrackingChange ||
      mouseTrackingChange.isFirstChange() ||
      !mouseTrackingChange.currentValue
    ) {
      return;
    }

    const currentAngles =
      mouseTrackingChange.currentValue as PolarAngels;

    this.rotate(
      this.center,
      this.origin,
      currentAngles.theta,
      currentAngles.phi,
    );

    for (const vertex of this.vertices) {
      this.rotate(
        vertex,
        this.origin,
        currentAngles.theta,
        currentAngles.phi,
      );
    }

    this.zIndex = Math.round(this.center.y);
    this.sortFacesByDepth();
  }

  private initializeGeometry(): void {
    this.mathLength = (this.length - 1) / 2;

    const halfSize = this.size / 2;

    this.origin = new Point3(
      this.centerX,
      this.centerY,
      this.centerZ,
    );

    this.center = new Point3(
      this.centerX +
      this.offsetX * (this.size + this.spacing),
      this.centerY +
      this.offsetY * (this.size + this.spacing),
      this.centerZ +
      this.offsetZ * (this.size + this.spacing),
    );

    const {x, y, z} = this.center;

    this.vertices = [
      new Point3(x + halfSize, y + halfSize, z + halfSize),
      new Point3(x + halfSize, y + halfSize, z - halfSize),
      new Point3(x + halfSize, y - halfSize, z + halfSize),
      new Point3(x + halfSize, y - halfSize, z - halfSize),
      new Point3(x - halfSize, y + halfSize, z + halfSize),
      new Point3(x - halfSize, y + halfSize, z - halfSize),
      new Point3(x - halfSize, y - halfSize, z + halfSize),
      new Point3(x - halfSize, y - halfSize, z - halfSize),
    ];

    this.faces = [];

    if (this.offsetX >= this.mathLength) {
      this.faces.push([
        this.vertices[0],
        this.vertices[1],
        this.vertices[3],
        this.vertices[2],
      ]);
    }

    if (this.offsetX <= -this.mathLength) {
      this.faces.push([
        this.vertices[4],
        this.vertices[5],
        this.vertices[7],
        this.vertices[6],
      ]);
    }

    if (this.offsetY >= this.mathLength) {
      this.faces.push([
        this.vertices[0],
        this.vertices[1],
        this.vertices[5],
        this.vertices[4],
      ]);
    }

    if (this.offsetY <= -this.mathLength) {
      this.faces.push([
        this.vertices[2],
        this.vertices[3],
        this.vertices[7],
        this.vertices[6],
      ]);
    }

    if (this.offsetZ >= this.mathLength) {
      this.faces.push([
        this.vertices[0],
        this.vertices[2],
        this.vertices[6],
        this.vertices[4],
      ]);
    }

    if (this.offsetZ <= -this.mathLength) {
      this.faces.push([
        this.vertices[1],
        this.vertices[3],
        this.vertices[7],
        this.vertices[5],
      ]);
    }

    this.zIndex = this.center.z;
  }

  private sortFacesByDepth(): void {
    if (this.faces.length < 2) {
      return;
    }

    const faceDepths = this.faces.map(face =>
      face.reduce(
        (sum, vertex) => sum + Math.round(vertex.y),
        0,
      ),
    );

    const order = sortedIndexesArray(faceDepths);

    this.faces = order.map(index => this.faces[index]);
  }

  rotate(
    vertex: Point3,
    center: Point3,
    theta: number,
    phi: number,
  ): void {
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);

    const x = vertex.x - center.x;
    const y = vertex.y - center.y;
    const z = vertex.z - center.z;

    vertex.x =
      cosTheta * x -
      sinTheta * cosPhi * y +
      sinTheta * sinPhi * z +
      center.x;

    vertex.y =
      sinTheta * x +
      cosTheta * cosPhi * y -
      cosTheta * sinPhi * z +
      center.y;

    vertex.z =
      sinPhi * y +
      cosPhi * z +
      center.z;
  }

  project(vertex: Point3): Point2 {
    return new Point2(vertex.x, vertex.z);
  }

  buildPath(facePoints: Point3[]): string {
    const coordinates = facePoints
      .map(point => this.getCoordinates(point))
      .join(' L ');

    return `M ${coordinates} Z`;
  }

  getCoordinates(point: Point3): string {
    const projectedPoint = this.project(point);

    return `${
      projectedPoint.x + this.xLocation
    } ${-projectedPoint.y + this.yLocation}`;
  }

  selected(): void {
    if (this.disabled) {
      return;
    }

    this.selectionEvent.emit(
      new Point3(
        this.offsetX,
        this.offsetY,
        this.offsetZ,
      ),
    );
  }
}
