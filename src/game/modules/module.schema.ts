import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class ModuleEntity {
  @Prop({ type: String, required: true, unique: true })
  name: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: String, required: true })
  rules: string;

  @Prop({ type: String, required: false })
  imgUrl?: string;

  /** Clues/steps distributed to analystes during the game */
  @Prop({ type: [Object], required: true })
  solutions: unknown[];

  /** Extra hints the agent can unlock (costs time). Separate from solutions. */
  @Prop({ type: [String], required: false, default: [] })
  hints: string[];
}

export const ModuleSchema = SchemaFactory.createForClass(ModuleEntity);
