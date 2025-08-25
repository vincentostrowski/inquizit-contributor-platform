import React from 'react';
import Card from '../Card';

const RelatedTab = ({ card, formData }) => {
  // Mock related cards data organized by category
  const mockRelatedCards = {
          relevant: [
        {
          id: 'rel-1',
          title: 'Cognitive Dissonance',
          description: 'The mental discomfort experienced when holding conflicting beliefs or values',
          banner: '',
          card_idea: 'Understanding how people handle conflicting information',
          content: 'Cognitive dissonance is a psychological phenomenon where individuals experience mental discomfort when holding conflicting beliefs, values, or attitudes.'
        },
        {
          id: 'rel-2',
          title: 'Confirmation Bias',
          description: 'The tendency to search for, interpret, and remember information that confirms preexisting beliefs',
          banner: '',
          card_idea: 'How people selectively process information',
          content: 'Confirmation bias is the tendency to search for, interpret, favor, and recall information in a way that confirms or supports one\'s prior beliefs or values.'
        },
        {
          id: 'rel-3',
          title: 'Anchoring Effect',
          description: 'The tendency to rely too heavily on the first piece of information offered when making decisions',
          banner: '',
          card_idea: 'How initial information influences decision making',
          content: 'The anchoring effect is a cognitive bias that describes the common human tendency to rely too heavily on the first piece of information offered when making decisions.'
        },
        {
          id: 'rel-4',
          title: 'Availability Heuristic',
          description: 'Making decisions based on information that comes to mind most easily',
          banner: '',
          card_idea: 'How easily recalled information affects judgments',
          content: 'The availability heuristic is a mental shortcut that relies on immediate examples that come to a given person\'s mind when evaluating a specific topic, concept, method or decision.'
        },
        {
          id: 'rel-5',
          title: 'Hindsight Bias',
          description: 'The tendency to see events as having been predictable after they have already occurred',
          banner: '',
          card_idea: 'The illusion of predictability',
          content: 'Hindsight bias, also known as the knew-it-all-along effect or creeping determinism, is the common tendency for people to perceive past events as having been more predictable than they actually were.'
        },
        {
          id: 'rel-6',
          title: 'Sunk Cost Fallacy',
          description: 'The tendency to continue an endeavor once an investment has been made',
          banner: '',
          card_idea: 'When past investments cloud current decisions',
          content: 'The sunk cost fallacy is the tendency to continue an endeavor once an investment in money, effort, or time has been made, even if the current costs outweigh the benefits.'
        },
        {
          id: 'rel-7',
          title: 'Bandwagon Effect',
          description: 'The tendency to do or believe things because many other people do or believe the same',
          banner: '',
          card_idea: 'Following the crowd in thinking and behavior',
          content: 'The bandwagon effect is a psychological phenomenon in which people do something primarily because other people are doing it, regardless of their own beliefs.'
        },
        {
          id: 'rel-8',
          title: 'Dunning-Kruger Effect',
          description: 'The tendency for unskilled individuals to overestimate their ability',
          banner: '',
          card_idea: 'When lack of knowledge leads to overconfidence',
          content: 'The Dunning-Kruger effect is a cognitive bias in which people with low ability at a task overestimate their ability, while people with high ability underestimate their ability.'
        }
      ],
    opposing: [
      {
        id: 'opp-1',
        title: 'Groupthink',
        description: 'The practice of thinking or making decisions as a group, often resulting in poor decisions',
        banner: '',
        card_idea: 'When group consensus leads to poor decisions',
        content: 'Groupthink is a psychological phenomenon that occurs within a group of people when the desire for harmony or conformity results in an irrational or dysfunctional decision-making outcome.'
      },
      {
        id: 'opp-2',
        title: 'Anchoring Effect',
        description: 'The tendency to rely too heavily on the first piece of information offered when making decisions',
        banner: '',
        card_idea: 'How initial information influences decision making',
        content: 'The anchoring effect is a cognitive bias that describes the common human tendency to rely too heavily on the first piece of information offered when making decisions.'
      }
    ],
    supporting: [
      {
        id: 'sup-1',
        title: 'Availability Heuristic',
        description: 'Making decisions based on information that comes to mind most easily',
        banner: '',
        card_idea: 'How easily recalled information affects judgments',
        content: 'The availability heuristic is a mental shortcut that relies on immediate examples that come to a given person\'s mind when evaluating a specific topic, concept, method or decision.'
      },
      {
        id: 'sup-2',
        title: 'Hindsight Bias',
        description: 'The tendency to see events as having been predictable after they have already occurred',
        banner: '',
        card_idea: 'The illusion of predictability',
        content: 'Hindsight bias, also known as the knew-it-all-along effect or creeping determinism, is the common tendency for people to perceive past events as having been more predictable than they actually were.'
      }
    ],
    specific: [
      {
        id: 'spec-1',
        title: 'Sunk Cost Fallacy',
        description: 'The tendency to continue an endeavor once an investment has been made',
        banner: '',
        card_idea: 'When past investments cloud current decisions',
        content: 'The sunk cost fallacy is the tendency to continue an endeavor once an investment in money, effort, or time has been made, even if the current costs outweigh the benefits.'
      }
    ],
    general: [
      {
        id: 'gen-1',
        title: 'Cognitive Biases',
        description: 'Systematic patterns of deviation from norm or rationality in judgment',
        banner: '',
        card_idea: 'Understanding systematic thinking errors',
        content: 'Cognitive biases are systematic patterns of deviation from norm or rationality in judgment, often studied in psychology and behavioral economics.'
      },
      {
        id: 'gen-2',
        title: 'Decision Making',
        description: 'The cognitive process of selecting a course of action from among multiple alternatives',
        banner: '',
        card_idea: 'How people make choices',
        content: 'Decision making is the cognitive process of selecting a course of action from among multiple alternatives, often involving the evaluation of options and their consequences.'
      }
    ]
  };

  const categoryLabels = {
    relevant: 'Relevant',
    opposing: 'Contrasting',
    supporting: 'Complementary',
    specific: 'Instances',
    general: 'Broader'
  };



  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium text-gray-900">Related Cards</h3>
          </div>
        </div>
        


        {/* Related Cards by Category */}
        {Object.entries(mockRelatedCards).map(([category, cards]) => (
          <div key={category} className="mb-8">
            {/* Category Header - Styled like Organize page rows */}
            <div className="bg-white border border-gray-200 rounded-lg mb-4">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h4 className="font-medium text-gray-900 text-sm">{categoryLabels[category]}</h4>
              </div>
              
              {/* Cards Row - Horizontal Scrolling */}
              <div className="py-4">
                <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2 px-4 min-h-[200px]">
                  {cards.map((relatedCard) => (
                    <div key={relatedCard.id} className="flex-shrink-0">
                      <Card 
                        card={relatedCard}
                        onClick={() => {}} // No click handler - cards are not clickable
                        showCompletionBadge={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedTab;
