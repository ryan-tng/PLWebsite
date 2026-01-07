"""
Management command to train the ML prediction model
"""
from django.core.management.base import BaseCommand
from predictions.models import Match
from predictions.views import ml_service


class Command(BaseCommand):
    help = 'Train the machine learning prediction model with match data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting model training...'))
        
        # Get all matches
        matches = Match.objects.all()
        match_count = matches.count()
        
        if match_count == 0:
            self.stdout.write(self.style.ERROR('No match data available. Please import data first.'))
            return
        
        self.stdout.write(f'Found {match_count} matches in database')
        
        # Train the model
        result = ml_service.train_model(matches)
        
        if result and isinstance(result, dict):
            self.stdout.write(self.style.SUCCESS('Model trained successfully!'))
            self.stdout.write('')
            self.stdout.write('=== REAL MODEL METRICS (for resume) ===')
            self.stdout.write(f'   Model Accuracy:     {result.get("accuracy", 0):.1%}')
            self.stdout.write(f'   Baseline Accuracy:  {result.get("baseline_accuracy", 0):.1%} (random guessing)')
            self.stdout.write(f'   Improvement:        +{result.get("improvement_over_baseline", 0):.1%} over baseline')
            self.stdout.write('')
            self.stdout.write('=== DETAILED METRICS ===')
            self.stdout.write(f'   Precision: {result.get("precision", 0):.1%}')
            self.stdout.write(f'   Recall:    {result.get("recall", 0):.1%}')
            self.stdout.write(f'   F1 Score:  {result.get("f1_score", 0):.1%}')
            self.stdout.write('')
            self.stdout.write('=== DATASET INFO ===')
            self.stdout.write(f'   Training samples: {result.get("training_samples", 0)} matches')
            self.stdout.write(f'   Test samples:     {result.get("test_samples", 0)} matches')
            self.stdout.write('')
        elif result:
            self.stdout.write(self.style.SUCCESS('Model trained successfully!'))
            self.stdout.write('   (Performance metrics not available)')
        else:
            self.stdout.write(self.style.ERROR('Model training failed. Check logs for details.'))

