import numpy as np
class llmConfusionMatrix:
    def __init__(self):
        # matrix[true_label][predicted_label]
        self.matrix = {
            True: {
                True: 0,
                False: 0,
                'Equally Good': 0
            },
            False: {
                True: 0,
                False: 0,
                'Equally Good': 0
            },
            'Equally Good': {
                True: 0,
                False: 0,
                'Equally Good': 0
            }
        }
    def __str__(self):
        s = "True\t\tFalse\t\tEqually Good\n"
        s += "{}\t{}\t{}\n".format(self.matrix[True][True], self.matrix[True][False], self.matrix[True]['Equally Good'])
        s += "{}\t{}\t{}\n".format(self.matrix[False][True], self.matrix[False][False], self.matrix[False]['Equally Good'])
        s += "{}\t{}\t{}".format(self.matrix['Equally Good'][True], self.matrix['Equally Good'][False], self.matrix['Equally Good']['Equally Good'])
        return s

    def add(self, true_label, predicted_label):
        self.matrix[true_label][predicted_label] += 1

    def addList(self, true_labels: list, predicted_labels: list):
        assert len(true_labels) == len(predicted_labels)
        for i in range(len(true_labels)):
            self.add(true_labels[i], predicted_labels[i])
    
    def get_accuracy(self):
        return (self.matrix[True][True] + self.matrix[False][False] + self.matrix['Equally Good']['Equally Good']) / sum([sum(self.matrix[True].values()), sum(self.matrix[False].values()), sum(self.matrix['Equally Good'].values())])
    def get_accuracy_by_label(self, label=True):
        return self.matrix[label][label] / sum([self.matrix[label][True], self.matrix[label][False], self.matrix[label]['Equally Good']])


    
